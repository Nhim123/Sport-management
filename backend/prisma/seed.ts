// Seed DB từ bộ dữ liệu mẫu Arena (khớp với frontend/src/mocks/data.ts).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURTS = [
  { id: 'cl1', name: 'Cầu lông 1', kind: 'Thảm PVC · trong nhà', sport: 'cl', price: 150000 },
  { id: 'cl2', name: 'Cầu lông 2', kind: 'Thảm PVC · trong nhà', sport: 'cl', price: 150000 },
  { id: 'pba', name: 'Pickleball A', kind: 'Ngoài trời · có mái', sport: 'pb', price: 180000 },
  { id: 'pbb', name: 'Pickleball B', kind: 'Ngoài trời', sport: 'pb', price: 180000 },
  { id: 'tn', name: 'Tennis', kind: 'Sân cứng · đèn LED', sport: 'tn', price: 250000 },
  { id: 'bd', name: 'Sân 5 người', kind: 'Cỏ nhân tạo', sport: 'bd', price: 450000 },
];

const TAKEN_TODAY: Record<string, number[]> = {
  cl1: [16, 17, 18, 19, 21],
  cl2: [18, 21],
  pba: [15, 17, 18, 20],
  pbb: [18, 19, 20],
  tn: [16, 17, 18, 19, 21, 22],
  bd: [18, 19, 20, 21],
};
const TAKEN_FUTURE = [18, 19];

const CLASSES = [
  { id: 'c1', time: '19:30', name: 'HIIT 45 phút', sub: 'HLV Khoa · còn 5 chỗ', full: false },
  { id: 'c2', time: '19:00', name: 'Vinyasa Flow', sub: 'Hết chỗ · danh sách chờ', full: true },
  { id: 'c3', time: '17:30', name: 'Hatha Yoga', sub: 'HLV Mai · còn 6 chỗ', full: false },
];

const PAY_METHODS = [
  { id: 'qr', logo: 'QR', title: 'Chuyển khoản VietQR', sub: 'Mọi ngân hàng · xác nhận tự động', tone: 'info', warn: false, sort: 0 },
  { id: 'wallet', logo: 'Ví', title: 'Ví điện tử', sub: 'MoMo, ZaloPay, ShopeePay', tone: 'clay', warn: false, sort: 1 },
  { id: 'card', logo: 'Thẻ', title: 'Thẻ ATM / Visa / Mastercard', sub: '', tone: 'neutral', warn: false, sort: 2 },
  { id: 'desk', logo: 'Quầy', title: 'Trả tại quầy', sub: 'Cần cọc 50% để giữ sân giờ cao điểm', tone: 'brand', warn: true, sort: 3 },
];

const MEMBER = { id: 'me', firstName: 'Minh Anh', plan: 'Gym 12 tháng + PT', daysLeft: 138, until: '05/03/2027', ptLeft: 7, usedPct: 62 };

const SCHEDULE = [
  { id: 's1', tag: 'HÔM NAY', time: '19:00', title: 'Cầu lông 2 · 1 giờ', sub: 'Mã ĐS-7731 · đã thanh toán', tone: 'brand', upcoming: true, sort: 0 },
  { id: 's2', tag: 'T3 20/10', time: '06:30', title: 'PT với HLV Khoa', sub: 'Buổi 18/24 · Thân dưới', tone: 'clay', upcoming: false, sort: 1 },
];

async function main() {
  console.log('Seeding…');

  await prisma.booking.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.member.deleteMany();
  await prisma.court.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.payMethod.deleteMany();

  await prisma.court.createMany({ data: COURTS });
  await prisma.classSession.createMany({ data: CLASSES });
  await prisma.payMethod.createMany({ data: PAY_METHODS });

  await prisma.member.create({ data: MEMBER });
  await prisma.scheduleItem.createMany({ data: SCHEDULE.map((s) => ({ ...s, memberId: MEMBER.id })) });

  // Tạo booking cho các giờ đã kín để GET /courts/:id/taken trả đúng dữ liệu
  const bookings: { code: string; courtId: string; dayIndex: number; hour: number }[] = [];
  for (const court of COURTS) {
    for (const hour of TAKEN_TODAY[court.id] ?? []) {
      bookings.push({ code: `SEED-${court.id}-0-${hour}`, courtId: court.id, dayIndex: 0, hour });
    }
    for (let day = 1; day <= 6; day++) {
      for (const hour of TAKEN_FUTURE) {
        bookings.push({ code: `SEED-${court.id}-${day}-${hour}`, courtId: court.id, dayIndex: day, hour });
      }
    }
  }
  await prisma.booking.createMany({ data: bookings });

  console.log(`Done: ${COURTS.length} courts, ${bookings.length} bookings, ${CLASSES.length} classes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
