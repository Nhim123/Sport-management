// Địa chỉ câu lạc bộ theo địa giới 2 cấp của Việt Nam (từ 01/07/2025): Tỉnh/Thành phố → Phường/Xã → Số nhà, tên đường.
// Tỉnh & phường/xã chọn từ danh mục hành chính chính thức (lib/vnAddress) – có ô tìm không dấu.
// Gợi ý từ GPS / khi gõ tên đường sẽ tự chọn tỉnh (đổi cả tên tỉnh cũ sang tỉnh mới) và phường/xã nếu khớp danh mục.
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mapUrl, nearbyAddresses, searchAddress, type GeoPlace, type LatLng } from '../api/geo.api';
import { filterUnits, fold, matchProvince, matchWard, provinceByCode, PROVINCES, shortName, type Province, type Ward } from '../lib/vnAddress';
import { fonts, radius, useColors } from '../theme/tokens';
import { AuthField, WEB_NO_OUTLINE, type AuthFieldRef } from './AuthField';
import { Icon, type IconName } from './Icon';
import { Label, Num, T } from './ui';

export interface AddressValue {
  /** Số nhà, tên đường */
  address: string;
  province: string;
  provinceCode?: number;
  ward: string;
  wardCode?: number;
  location?: LatLng;
}

type Gps =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'done'; at: LatLng; list: GeoPlace[] }
  | { status: 'error'; message: string };

const MIN_QUERY = 3;
const DEBOUNCE_MS = 400;

export function AddressPicker({
  value,
  onChange,
  errors,
}: {
  value: AddressValue;
  onChange: (patch: Partial<AddressValue>) => void;
  errors?: { address?: string; ward?: string; province?: string };
}) {
  const c = useColors();
  const [gps, setGps] = useState<Gps>({ status: 'idle' });
  /** Chữ người dùng đang gõ để tìm (rỗng khi ô vừa được điền từ gợi ý) */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ q: string; list: GeoPlace[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [needsNumber, setNeedsNumber] = useState(false);
  /** Ghi chú sau khi tự điền từ gợi ý (VD: chưa khớp được phường/xã mới) */
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'province' | 'ward' | null>(null);
  const streetRef = useRef<AuthFieldRef>(null);

  const province = provinceByCode(value.provinceCode);
  const near = value.location ?? (gps.status === 'done' ? gps.at : null);

  // Gõ tới đâu gợi ý tới đó: chờ ngừng gõ 400ms, huỷ yêu cầu cũ khi gõ tiếp
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setSearching(true);
      setSearchErr(null);
      // Đã chọn tỉnh thì thêm tên tỉnh vào câu tìm – bản đồ trả đúng đường trong tỉnh đó thay vì cùng tên ở tỉnh khác
      const inProvince = province && !fold(q).includes(fold(shortName(province.name))) ? `${q}, ${shortName(province.name)}` : q;
      searchAddress(inProvince, near, ctl.signal)
        .then((list) => setResults({ q, list }))
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setSearchErr(e.message);
        })
        .finally(() => {
          if (!ctl.signal.aborted) setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
    // near chỉ dùng để ưu tiên kết quả gần – không cần tìm lại khi nó đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, province?.code]);

  const typing = query.trim().length >= MIN_QUERY;
  // Kết quả cùng phường/xã lên trước, rồi cùng tỉnh, rồi nơi khác
  const list = useMemo(() => {
    if (!typing || results?.q !== query.trim()) return [];
    if (!province) return results.list;
    const rank = (p: GeoPlace) => {
      if (matchProvince(p.province)?.code !== province.code) return 2;
      return matchWard(province, p.ward)?.code === value.wardCode ? 0 : 1;
    };
    return [...results.list].sort((a, b) => rank(a) - rank(b));
  }, [typing, results, query, province, value.wardCode]);
  const showPanel = typing && (searching || !!searchErr || results?.q === query.trim());

  const locate = async () => {
    setGps({ status: 'locating' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        throw new Error(
          perm.canAskAgain
            ? 'Cần quyền vị trí để gợi ý địa chỉ. Bấm lại và chọn “Cho phép”, hoặc nhập địa chỉ bên dưới.'
            : 'Quyền vị trí đang tắt – bật lại trong Cài đặt của máy, hoặc nhập địa chỉ bên dưới.',
        );
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const found = await nearbyAddresses(at);
      if (!found.length) throw new Error('Không tìm thấy địa chỉ quanh vị trí này – hãy nhập địa chỉ bên dưới.');
      setGps({ status: 'done', at, list: found });
    } catch (e) {
      const msg = (e as Error).message;
      setGps({
        status: 'error',
        message: msg.startsWith('Cần quyền') || msg.startsWith('Quyền') || msg.startsWith('Không') ? msg : 'Không lấy được vị trí – kiểm tra GPS / quyền vị trí, hoặc nhập địa chỉ bên dưới.',
      });
    }
  };

  /** Chọn gợi ý: điền số nhà/đường, đối chiếu tỉnh + phường/xã với danh mục 2 cấp, ghim toạ độ */
  const pick = (p: GeoPlace) => {
    const patch: Partial<AddressValue> = { address: p.street, location: { lat: p.lat, lng: p.lng } };
    const prov = matchProvince(p.province);
    let note: string | null = null;
    if (prov) {
      Object.assign(patch, { province: prov.name, provinceCode: prov.code });
      const w = matchWard(prov, p.ward);
      if (w) Object.assign(patch, { ward: w.name, wardCode: w.code });
      else if (prov.code === value.provinceCode && value.wardCode) {
        note = `Giữ ${value.ward} – kiểm tra lại nếu địa chỉ thuộc phường/xã khác.`;
      } else {
        Object.assign(patch, { ward: '', wardCode: undefined });
        note = `Đã chọn ${prov.name}. Chưa xác định được phường/xã cho địa chỉ này – hãy chọn phường/xã.`;
      }
    } else if (!province) {
      note = 'Chưa xác định được tỉnh/thành từ gợi ý – hãy chọn tỉnh/thành và phường/xã.';
    }
    onChange(patch);
    setAutoNote(note);
    setQuery('');
    setResults(null);
    setNeedsNumber(!p.hasHouseNumber);
    if (gps.status === 'done') setGps({ status: 'idle' });
  };

  const typeAddress = (v: string) => {
    onChange({ address: v });
    setQuery(v);
    if (needsNumber && /^\d/.test(v.trim())) setNeedsNumber(false);
  };

  const pickProvince = (p: Province) => {
    setSheet(null);
    setAutoNote(null);
    if (p.code === value.provinceCode) return;
    onChange({ province: p.name, provinceCode: p.code, ward: '', wardCode: undefined });
    // Chọn tỉnh xong mở luôn danh sách phường/xã
    setTimeout(() => setSheet('ward'), Platform.OS === 'ios' ? 450 : 50);
  };
  const pickWard = (w: Ward) => {
    setSheet(null);
    setAutoNote(null);
    onChange({ ward: w.name, wardCode: w.code });
    if (!value.address.trim()) setTimeout(() => streetRef.current?.focus(), 300);
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Lấy vị trí hiện tại */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dùng vị trí hiện tại để gợi ý địa chỉ"
        accessibilityState={{ busy: gps.status === 'locating' }}
        disabled={gps.status === 'locating'}
        onPress={locate}
        style={({ pressed }) => [s.gps, { backgroundColor: pressed ? c.brandTint : c.brandWash, borderColor: c.brandTint }]}
      >
        <View style={[s.gpsIcon, { backgroundColor: c.brand }]}>
          <Icon name="pin" size={18} color={c.onBrand} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T size={14} w={700} color={c.brandInk}>{gps.status === 'locating' ? 'Đang xác định vị trí…' : gps.status === 'done' ? 'Lấy lại vị trí hiện tại' : 'Dùng vị trí hiện tại'}</T>
          <T size={12} color={c.inkMuted}>Đang ở câu lạc bộ? Tự điền địa chỉ từ GPS.</T>
        </View>
        {gps.status === 'locating' ? <ActivityIndicator color={c.brand} /> : <Icon name="chevronRight" size={18} color={c.brandInk} />}
      </Pressable>

      {gps.status === 'error' && (
        <View accessibilityRole="alert" style={[s.inlineMsg, { backgroundColor: c.warningTint }]}>
          <Icon name="alert" size={16} color={c.warning} />
          <T size={12} color={c.warning} style={{ flex: 1 }}>{gps.message}</T>
        </View>
      )}

      {gps.status === 'done' && (
        <View style={{ gap: 6 }}>
          <Label>Gần vị trí của bạn</Label>
          <Suggestions list={gps.list} onPick={pick} />
        </View>
      )}

      <View style={s.or}>
        <View style={[s.orLine, { backgroundColor: c.line }]} />
        <T size={12} color={c.inkMuted}>hoặc chọn địa chỉ</T>
        <View style={[s.orLine, { backgroundColor: c.line }]} />
      </View>

      {/* Địa giới 2 cấp */}
      <SelectField
        label="Tỉnh / Thành phố"
        icon="pin"
        value={value.province}
        placeholder="Chọn tỉnh / thành phố"
        error={errors?.province}
        onPress={() => setSheet('province')}
      />
      <SelectField
        label="Phường / Xã"
        icon="grid"
        value={value.ward}
        placeholder={province ? `Chọn phường / xã · ${province.wards.length} đơn vị` : 'Chọn tỉnh / thành phố trước'}
        disabled={!province}
        error={errors?.ward}
        onPress={() => setSheet('ward')}
      />

      {autoNote && (
        <View accessibilityRole="alert" style={[s.inlineMsg, { backgroundColor: c.infoTint }]}>
          <Icon name="info" size={16} color={c.info} />
          <T size={12} color={c.info} style={{ flex: 1 }}>{autoNote}</T>
        </View>
      )}

      {/* Số nhà, tên đường + gợi ý khi gõ */}
      <View style={{ gap: 6 }}>
        <AuthField
          ref={streetRef}
          label="Số nhà, tên đường"
          icon="home"
          value={value.address}
          onChangeText={typeAddress}
          placeholder="VD: 12 Nguyễn Thị Thập"
          autoComplete="street-address"
          textContentType="streetAddressLine1"
          returnKeyType="done"
          hint={needsNumber ? 'Nhớ thêm số nhà vào đầu (VD: 12 Nguyễn Thị Thập).' : typing ? undefined : 'Gõ tên đường / địa điểm để xem gợi ý và ghim vị trí.'}
          error={errors?.address}
        />
        {showPanel && (
          <View style={[s.panel, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
            {searching && list.length === 0 ? (
              <View style={s.panelRow}>
                <ActivityIndicator size="small" color={c.brand} />
                <T size={13} color={c.inkMuted}>Đang tìm gợi ý…</T>
              </View>
            ) : searchErr ? (
              <View style={s.panelRow}>
                <Icon name="alert" size={16} color={c.warning} />
                <T size={13} color={c.warning} style={{ flex: 1 }}>{searchErr}</T>
              </View>
            ) : list.length === 0 ? (
              <View style={s.panelRow}>
                <Icon name="info" size={16} color={c.inkMuted} />
                <T size={13} color={c.inkMuted} style={{ flex: 1 }}>Không thấy gợi ý phù hợp – cứ nhập số nhà, tên đường, vẫn đăng ký được.</T>
              </View>
            ) : (
              <Suggestions list={list} onPick={pick} flat />
            )}
            <T size={10} color={c.inkMuted} style={{ textAlign: 'right', paddingHorizontal: 12, paddingBottom: 6 }}>Gợi ý từ © OpenStreetMap</T>
          </View>
        )}
      </View>

      {/* Đã ghim toạ độ */}
      {value.location && (
        <View style={[s.pinned, { backgroundColor: c.brandWash, borderColor: c.brandTint }]}>
          <Icon name="check" size={16} color={c.brand} />
          <T size={12} w={600} color={c.brandInk} style={{ flex: 1 }} numberOfLines={1}>Đã ghim vị trí</T>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(mapUrl(value.location!))} hitSlop={8}>
            <T size={12} w={700} color={c.brand}>Xem bản đồ</T>
          </Pressable>
          <T size={12} color={c.lineStrong}>·</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Bỏ ghim vị trí" onPress={() => onChange({ location: undefined })} hitSlop={8}>
            <T size={12} w={700} color={c.inkMuted}>Bỏ ghim</T>
          </Pressable>
        </View>
      )}

      <UnitSheet
        visible={sheet === 'province'}
        title="Tỉnh / Thành phố"
        subtitle="34 tỉnh, thành phố"
        items={PROVINCES}
        selected={value.provinceCode}
        searchPlaceholder="Tìm tỉnh / thành phố"
        onPick={pickProvince}
        onClose={() => setSheet(null)}
      />
      <UnitSheet
        visible={sheet === 'ward' && !!province}
        title="Phường / Xã"
        subtitle={province ? `${province.name} · ${province.wards.length} đơn vị` : ''}
        items={province?.wards ?? []}
        selected={value.wardCode}
        searchPlaceholder="Tìm phường / xã"
        onPick={pickWard}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

/** Ô chọn (nhìn giống ô nhập) – bấm mở danh sách */
function SelectField({
  label,
  icon,
  value,
  placeholder,
  error,
  disabled,
  onPress,
}: {
  label: string;
  icon: IconName;
  value: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <T size={13} w={600} color={disabled ? c.inkMuted : undefined}>{label}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'chưa chọn'}`}
        accessibilityHint={error}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          s.select,
          { borderColor: error ? c.danger : c.lineStrong, backgroundColor: disabled || pressed ? c.surfaceSunken : c.surfaceRaised },
        ]}
      >
        <Icon name={icon} size={18} color={error ? c.danger : value ? c.brand : c.inkMuted} />
        <T size={15} color={value ? c.ink : c.inkMuted} numberOfLines={1} style={{ flex: 1 }}>{value || placeholder}</T>
        <Icon name="chevronDown" size={18} color={c.inkMuted} />
      </Pressable>
      {error && (
        <View style={s.msg}>
          <Icon name="alert" size={14} color={c.danger} />
          <T size={12} color={c.danger} style={{ flex: 1 }}>{error}</T>
        </View>
      )}
    </View>
  );
}

/** Danh sách chọn đơn vị hành chính dạng sheet, có ô tìm không dấu */
function UnitSheet<U extends { code: number; name: string }>({
  visible,
  title,
  subtitle,
  items,
  selected,
  searchPlaceholder,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  items: U[];
  selected?: number;
  searchPlaceholder: string;
  onPick: (u: U) => void;
  onClose: () => void;
}) {
  const c = useColors();
  const [q, setQ] = useState('');
  const shown = useMemo(() => filterUnits(items, q), [items, q]);

  const close = () => {
    setQ('');
    onClose();
  };
  const choose = (u: U) => {
    setQ('');
    onPick(u);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Đóng" onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        <SafeAreaView edges={['bottom']} style={[s.sheet, { backgroundColor: c.surfaceRaised }]}>
          <View style={s.sheetHead}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Num size={22}>{title}</Num>
              <T size={12} color={c.inkMuted} numberOfLines={1}>{subtitle}</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={close} style={s.close}>
              <Icon name="close" color={c.ink} />
            </Pressable>
          </View>
          <View style={[s.search, { borderColor: c.lineStrong, backgroundColor: c.surfaceSunken }]}>
            <Icon name="search" size={18} color={c.inkMuted} />
            <TextInput
              accessibilityLabel={searchPlaceholder}
              value={q}
              onChangeText={setQ}
              placeholder={searchPlaceholder}
              placeholderTextColor={c.inkMuted}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => shown.length === 1 && choose(shown[0])}
              style={[s.searchInput, { color: c.ink, fontFamily: fonts.sans400 }, Platform.OS === 'web' && WEB_NO_OUTLINE]}
            />
            {!!q && (
              <Pressable accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm" onPress={() => setQ('')} hitSlop={8}>
                <Icon name="close" size={16} color={c.inkMuted} />
              </Pressable>
            )}
          </View>
          <FlatList
            data={shown}
            keyExtractor={(u) => String(u.code)}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            style={{ flex: 1 }}
            ListEmptyComponent={<T size={13} color={c.inkMuted} style={{ padding: 16, textAlign: 'center' }}>Không tìm thấy “{q.trim()}”.</T>}
            renderItem={({ item, index }) => {
              const on = item.code === selected;
              const short = shortName(item.name);
              const kind = item.name.slice(0, item.name.length - short.length).trim();
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={item.name}
                  onPress={() => choose(item)}
                  style={({ pressed }) => [s.row, index > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }, (pressed || on) && { backgroundColor: on ? c.brandWash : c.surfaceSunken }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T size={15} w={on ? 700 : 500} color={on ? c.brandInk : c.ink} numberOfLines={1}>{short}</T>
                    {!!kind && <T size={11} color={c.inkMuted}>{kind}</T>}
                  </View>
                  {on && <Icon name="check" size={18} color={c.brand} />}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Suggestions({ list, onPick, flat }: { list: GeoPlace[]; onPick: (p: GeoPlace) => void; flat?: boolean }) {
  const c = useColors();
  return (
    <View accessibilityRole="list" style={flat ? undefined : [s.panel, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
      {list.map((p, i) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${p.title}, ${p.subtitle}`}
          onPress={() => onPick(p)}
          style={({ pressed }) => [s.item, i > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }, pressed && { backgroundColor: c.surfaceSunken }]}
        >
          <View style={[s.itemIcon, { backgroundColor: c.surfaceSunken }]}>
            <Icon name="pin" size={16} color={c.inkMuted} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T size={14} w={600} numberOfLines={1}>{p.title}</T>
            <T size={12} color={c.inkMuted} numberOfLines={2}>{p.subtitle}</T>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  gps: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  gpsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inlineMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: radius.md },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12 },
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  panel: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 52 },
  itemIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1 },
  sheet: { height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 16, gap: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: '100%', fontSize: 15, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 10, minHeight: 52, borderRadius: 8 },
});
