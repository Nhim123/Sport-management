import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Badge, Banner, Btn, Chip, ChipRow, Screen, Segmented, Sheet, SportBadge } from '../../components/kit';
import { Card, Num, T } from '../../components/ui';
import { useConfirmNotice, useNotices, useRejectNotice } from '../../hooks/useAdmin';
import { vnd } from '../../lib/format';
import { useAuth } from '../../store/auth';
import { radius, useColors } from '../../theme/tokens';
import type { Notice, NoticeKind, Tone } from '../../types/admin';

/** Nhãn, màu, nút xác nhận và lý do từ chối cho từng loại việc */
const KIND: Record<NoticeKind, { label: string; tone: Tone; confirm: string; reasons: string[] }> = {
  booking: { label: 'Đặt sân online', tone: 'info', confirm: 'Xếp sân', reasons: ['Khung giờ đã kín', 'Sân đang bảo trì', 'Thông tin liên hệ không hợp lệ'] },
  payment: { label: 'Khách đặt sân · chờ xác nhận thanh toán', tone: 'warning', confirm: 'Đã nhận thanh toán', reasons: ['Chưa nhận được tiền', 'Sai số tiền', 'Khách hủy đặt'] },
  deposit: { label: 'Tiền cọc chờ đối soát', tone: 'warning', confirm: 'Đã nhận cọc', reasons: ['Chưa nhận được tiền', 'Sai số tiền'] },
  renewal: { label: 'Gia hạn chuyển khoản', tone: 'success', confirm: 'Xác nhận gia hạn', reasons: ['Chưa nhận được tiền', 'Sai số tiền', 'Sai mã hội viên'] },
  freeze: { label: 'Xin bảo lưu', tone: 'class', confirm: 'Duyệt bảo lưu', reasons: ['Không đủ điều kiện bảo lưu', 'Thiếu giấy tờ chứng minh'] },
};

type Tab = 'pending' | 'done';

/** Trung tâm thông báo: các việc cần nhân viên xác nhận và lịch sử đã xử lý */
export default function Notices() {
  const c = useColors();
  const { user } = useAuth();
  const by = user?.name ?? 'Nhân viên';
  const { data = [] } = useNotices();
  const confirm = useConfirmNotice();
  const reject = useRejectNotice();
  const [tab, setTab] = useState<Tab>('pending');
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);
  const [rejecting, setRejecting] = useState<Notice | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = data.filter((n) => n.status === 'pending');
  const done = data.filter((n) => n.status !== 'pending');

  const doConfirm = (n: Notice) => {
    // Đặt sân online: chuyển sang màn chọn sân để xếp khách vào sân trống
    if (n.kind === 'booking') {
      setMsg(null);
      router.push({ pathname: '/quan-ly/xep-san', params: { id: n.id } });
      return;
    }
    setBusyId(n.id);
    confirm.mutate(
      { id: n.id, by },
      {
        onSuccess: () => setMsg({ tone: 'success', text: `${KIND[n.kind].confirm}: ${n.who.split(' · ')[0]} – ${n.detail}.` }),
        onError: (e) => setMsg({ tone: 'danger', text: `${(e as Error).message} Có thể từ chối và báo lại cho khách.` }),
        onSettled: () => setBusyId(null),
      },
    );
  };

  const openReject = (n: Notice) => {
    setRejecting(n);
    setReason(KIND[n.kind].reasons[0]);
  };

  const doReject = () => {
    const n = rejecting;
    if (!n || !reason) return;
    reject.mutate(
      { id: n.id, by, reason },
      {
        onSuccess: () => {
          setMsg({ tone: 'neutral', text: `Đã từ chối ${KIND[n.kind].label.toLowerCase()} của ${n.who.split(' · ')[0]}.` });
          setRejecting(null);
        },
        onError: (e) => setMsg({ tone: 'danger', text: (e as Error).message }),
      },
    );
  };

  return (
    <Screen title="Thông báo" sub={pending.length ? `${pending.length} việc cần xác nhận` : 'Không có việc cần xác nhận'} back>
      <Segmented
        options={[
          { id: 'pending', label: `Cần xác nhận ${pending.length}` },
          { id: 'done', label: `Đã xử lý ${done.length}` },
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setMsg(null);
        }}
      />
      {msg && <Banner tone={msg.tone} text={msg.text} />}

      {tab === 'pending' &&
        (pending.length === 0 ? (
          <View style={st.empty}>
            <View style={[st.emptyIc, { backgroundColor: c.brandTint }]}>
              <Icon name="check" size={28} color={c.brandInk} />
            </View>
            <T w={700}>Đã xử lý hết</T>
            <T size={13} color={c.inkMuted} style={{ textAlign: 'center' }}>Khi có đặt sân online, tiền cọc, gia hạn hay xin bảo lưu cần xác nhận, chuông sẽ báo số lượng.</T>
          </View>
        ) : (
          pending.map((n) => {
            const k = KIND[n.kind];
            const busy = busyId === n.id;
            return (
              <Card key={n.id} style={{ gap: 10 }}>
                <View style={st.head}>
                  <SportBadge sport={n.sport} size={40} />
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Badge label={k.label} tone={k.tone} />
                    <T w={700} numberOfLines={1}>{n.who}</T>
                  </View>
                  <T size={12} color={c.inkMuted}>{n.at}</T>
                </View>
                <View style={st.row}>
                  <T size={14} style={{ flex: 1 }}>{n.detail}</T>
                  {n.amount !== undefined && <Num size={18} w={600}>{vnd(n.amount)}</Num>}
                </View>
                {n.note && (
                  <View style={[st.note, { backgroundColor: c.surfaceSunken }]}>
                    <T size={13} color={c.inkMuted}>{n.note}</T>
                  </View>
                )}
                <View style={st.row}>
                  <Btn label="Từ chối" kind="secondary" disabled={busy} onPress={() => openReject(n)} style={{ flex: 1 }} />
                  <Btn label={busy ? 'Đang xử lý…' : k.confirm} icon={n.kind === 'booking' ? 'grid' : 'check'} disabled={busy} onPress={() => doConfirm(n)} style={{ flex: 1.4 }} />
                </View>
              </Card>
            );
          })
        ))}

      {tab === 'done' &&
        (done.length === 0 ? (
          <T size={13} color={c.inkMuted}>Chưa có việc nào được xử lý.</T>
        ) : (
          <Card style={{ padding: 0 }}>
            {done.map((n, i) => (
              <View key={n.id} style={[st.doneRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }]}>
                <SportBadge sport={n.sport} size={36} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <T w={600} numberOfLines={1}>{n.who.split(' · ')[0]} · {KIND[n.kind].label}</T>
                  <T size={12} color={c.inkMuted} numberOfLines={1}>{n.detail}</T>
                  <T size={12} color={c.inkMuted}>
                    {n.resolvedBy} · {n.resolvedAt}
                    {n.reason ? ` · ${n.reason}` : ''}
                  </T>
                </View>
                <Badge label={n.status === 'confirmed' ? 'Đã xác nhận' : 'Đã từ chối'} tone={n.status === 'confirmed' ? 'success' : 'danger'} />
              </View>
            ))}
          </Card>
        ))}

      <Sheet visible={!!rejecting} onClose={() => setRejecting(null)} title="Từ chối yêu cầu">
        {rejecting && (
          <>
            <T size={14}>
              {KIND[rejecting.kind].label} · <T w={700}>{rejecting.who.split(' · ')[0]}</T> · {rejecting.detail}
            </T>
            <T size={13} w={700}>Lý do</T>
            <ChipRow>
              {KIND[rejecting.kind].reasons.map((r) => (
                <Chip key={r} label={r} on={reason === r} onPress={() => setReason(r)} />
              ))}
            </ChipRow>
            <Btn label={reject.isPending ? 'Đang từ chối…' : 'Từ chối yêu cầu'} kind="danger" disabled={reject.isPending} onPress={doReject} />
            <Btn label="Quay lại" kind="ghost" onPress={() => setRejecting(null)} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  note: { borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  emptyIc: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
