import { useId, useState } from 'react';

export interface ChartSeries {
  label: string;
  color: string;
}

export interface ChartDatum {
  label: string;
  full: string;
  future?: boolean;
  values: number[];
}

interface Props {
  /** Thứ tự từ dưới lên trong cột chồng; cùng thứ tự với legend */
  series: ChartSeries[];
  data: ChartDatum[];
  format: (n: number) => string;
  axisFormat: (n: number) => string;
  ariaLabel: string;
  height?: number;
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

/** Nhãn trục X thưa: mỗi 5 thì theo mốc 1, 5, 10, 15…; còn lại cách đều từ đầu */
const showTick = (i: number, stride: number) => (stride === 5 ? i === 0 || (i + 1) % 5 === 0 : i % stride === 0);

export function BarChart({ series, data, format, axisFormat, ariaLabel, height = 220 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  const sums = data.map((d) => d.values.reduce((a, b) => a + b, 0));
  const max = niceMax(Math.max(0, ...sums));
  const n = data.length;
  const stride = n > 24 ? 5 : n > 14 ? 2 : 1;
  const gap = n > 24 ? 3 : 6;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, columnGap: gap };
  const hovered = hover !== null ? data[hover] : null;
  const align = hover === null ? '' : hover < n * 0.2 ? ' start' : hover > n * 0.8 ? ' end' : '';

  return (
    <div className="bc">
      <div className="bc-body" style={{ height }}>
        <div className="bc-y" aria-hidden="true">
          <span>{axisFormat(max)}</span>
          <span>{axisFormat(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="bc-plot" role="group" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
          <div className="bc-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="bc-cols" style={cols}>
            {data.map((d, i) => (
              <div
                key={i}
                className={'bc-col' + (hover === i ? ' on' : '') + (d.future ? ' future' : '')}
                tabIndex={0}
                aria-label={
                  d.full + ': ' + (d.future ? 'chưa có dữ liệu' : series.map((s, j) => `${s.label} ${format(d.values[j])}`).join(', '))
                }
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <div className="bc-stack">
                  {d.values.map((v, j) =>
                    v > 0 ? <div key={j} className="bc-seg" style={{ height: `${(v / max) * 100}%`, background: series[j].color }} /> : null,
                  )}
                </div>
              </div>
            ))}
          </div>
          {hovered && (
            <div className={'bc-tip' + align} style={{ left: `${((hover! + 0.5) / n) * 100}%` }} aria-hidden="true">
              <b>{hovered.full}</b>
              {hovered.future ? (
                <span className="muted">Chưa có dữ liệu</span>
              ) : (
                <>
                  {series.map((s, j) => (
                    <span key={j} className="bc-tip-row">
                      <span className="sw" style={{ background: s.color }} />
                      {s.label}
                      <span className="num">{format(hovered.values[j])}</span>
                    </span>
                  ))}
                  {series.length > 1 && (
                    <span className="bc-tip-row total">
                      Tổng<span className="num">{format(sums[hover!])}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="bc-x" style={cols} aria-hidden="true">
        {data.map((d, i) => (
          <span key={i} className={d.future ? 'future' : ''}>{showTick(i, stride) ? d.label : ''}</span>
        ))}
      </div>

      <div className="bc-foot">
        {series.length > 1 && (
          <div className="bc-legend">
            {series.map((s) => (
              <span key={s.label}>
                <span className="sw" style={{ background: s.color }} aria-hidden="true" />
                {s.label}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? 'Ẩn bảng số liệu' : 'Xem bảng số liệu'}
        </button>
      </div>

      {showTable && (
        <div id={tableId} className="bc-table">
          <table className="table">
            <thead>
              <tr>
                <th>Thời gian</th>
                {series.map((s) => (
                  <th key={s.label} style={{ textAlign: 'right' }}>{s.label}</th>
                ))}
                {series.length > 1 && <th style={{ textAlign: 'right' }}>Tổng</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) =>
                d.future ? null : (
                  <tr key={i}>
                    <td>{d.full}</td>
                    {d.values.map((v, j) => (
                      <td key={j} className="num" style={{ textAlign: 'right', fontSize: 16 }}>{format(v)}</td>
                    ))}
                    {series.length > 1 && (
                      <td className="num" style={{ textAlign: 'right', fontSize: 16, fontWeight: 600 }}>{format(sums[i])}</td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
