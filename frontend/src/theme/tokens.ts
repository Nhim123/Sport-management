// Arena design tokens – cùng nguồn với web (src/styles/tokens.css)
const light = {
  surface: '#f6f5f0',
  surfaceRaised: '#ffffff',
  surfaceSunken: '#ecebe4',
  line: '#dcdad0',
  lineSoft: '#ecebe4',
  lineStrong: '#83887f',
  ink: '#151a16',
  inkMuted: '#575e58',
  brand: '#1f6b45',
  brandStrong: '#17573a',
  onBrand: '#ffffff',
  brandTint: '#dcefe3',
  brandWash: '#f3faf6',
  brandInk: '#14492f',
  volt: '#d4f23a',
  onVolt: '#151a16',
  clay: '#b24d22',
  clayTint: '#f7e3d8',
  clayInk: '#7a3214',
  warning: '#8a5600',
  warningTint: '#fbeccc',
  danger: '#b3261e',
  dangerTint: '#fbe1de',
  info: '#2459a8',
  infoTint: '#e0eaf8',
  slotBlocked: '#e3e1d9',
  passBg: '#151a16',
  passInk: '#eef0ea',
  passMuted: '#a3aaa3',
  passTrack: '#2e322e',
  passLine: '#4fbf83',
};

export type Colors = typeof light;


/** React Native không tự chọn biến thể theo fontWeight với font tuỳ chỉnh – dùng đúng tên từng biến thể. */
export const fonts = {
  display600: 'BarlowCondensed_600SemiBold',
  display700: 'BarlowCondensed_700Bold',
  sans400: 'BeVietnamPro_400Regular',
  sans500: 'BeVietnamPro_500Medium',
  sans600: 'BeVietnamPro_600SemiBold',
  sans700: 'BeVietnamPro_700Bold',
};

export const radius = { sm: 6, md: 10, lg: 16, xl: 20, pill: 999 };

/** App chỉ dùng giao diện sáng (không đổi theo chế độ tối của máy) */
export function useColors(): Colors {
  return light;
}
