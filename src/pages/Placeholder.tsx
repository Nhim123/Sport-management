import { Link } from 'react-router-dom';

export default function Placeholder({ title, back = '/' }: { title: string; back?: string }) {
  return (
    <div style={{ padding: back === '/app' ? '24px 20px' : 0, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
      <h1 className="page-title">{title}</h1>
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <p className="muted">Màn hình này chưa có trong bản thiết kế Arena.</p>
        <Link to={back} style={{ fontWeight: 600 }}>← Quay lại</Link>
      </div>
    </div>
  );
}
