import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ - KiddyCare',
  description: 'ระบบการจัดการคลังสินค้า ร้าน KiddyCare',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

