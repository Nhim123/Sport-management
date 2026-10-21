import { Redirect } from 'expo-router';

/** Tab "Đặt sân" chuyển sang màn /dat-san (toàn trang). File này chỉ đón link trực tiếp tới /book. */
export default function BookTab() {
  return <Redirect href="/dat-san" />;
}
