// Mẫu thẻ gói tập để in và phát cho khách. Một mẫu dùng chung, tự điền theo từng gói.
import { vnd } from '../lib/format';
import { benefitTags, templateOf, type Plan } from '../lib/plans';
import { Icon } from './Icon';

export function PlanCard({ plan, org = 'ARENA', branch = 'Chi nhánh Quận 7' }: { plan: Plan; org?: string; branch?: string }) {
  const tpl = templateOf(plan.templateId);
  const tags = benefitTags(plan).slice(0, 4);
  const holder = plan.custom?.customer ?? '';
  const code = plan.custom?.memberCode ?? '';

  return (
    <div className="pcard" role="img" aria-label={`Thẻ gói ${plan.name}`}>
      <div className="pcard-glow" aria-hidden="true" />
      <div className="pcard-top">
        <div className="pcard-brand">
          <span className="pcard-word">{org}</span>
          <span className="pcard-kind">Thẻ gói tập · {branch}</span>
        </div>
        <span className="pcard-ic" aria-hidden="true"><Icon name={tpl.icon} size={22} /></span>
      </div>

      <div className="pcard-mid">
        <span className="pcard-cat">{plan.custom ? 'Gói riêng' : tpl.name}</span>
        <span className="pcard-name">{plan.name}</span>
        <div className="pcard-tags">
          {tags.map((t) => (
            <span key={t} className="pcard-tag">{t}</span>
          ))}
        </div>
      </div>

      <div className="pcard-bot">
        <div className="pcard-fields">
          <div>
            <span className="pcard-lbl">Chủ thẻ</span>
            <b className="pcard-val">{holder || '. . . . . . . . . . . . . . . .'}</b>
          </div>
          <div className="pcard-meta">
            <span><span className="pcard-lbl">Thời hạn</span><b>{plan.months} tháng</b></span>
            <span><span className="pcard-lbl">Giá</span><b>{vnd(plan.price)}</b></span>
            <span><span className="pcard-lbl">Mã thẻ</span><b className="mono">{code || '— — — —'}</b></span>
          </div>
        </div>
        <span className="pcard-qr" aria-hidden="true"><Icon name="qr" size={40} /></span>
      </div>
    </div>
  );
}
