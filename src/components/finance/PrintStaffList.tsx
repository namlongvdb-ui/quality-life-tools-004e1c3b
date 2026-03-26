import { useMemo } from 'react';
import { StaffMember, StaffSettings } from '@/types/finance';
import { getStaffList, getStaffSettings, calculateInsuranceSalary, calculateUnionFee } from '@/lib/staff-store';
import { getOrgSettings } from '@/lib/finance-store';

const POSITION_RANK: Record<string, number> = {
  'giám đốc': 1, 'phó giám đốc': 2,
  'trưởng phòng': 3, 'phó trưởng phòng': 4, 'phó phòng': 4,
  'trưởng ban': 3, 'phó trưởng ban': 4,
  'chủ tịch': 1, 'phó chủ tịch': 2,
  'tổ trưởng': 5, 'phó tổ trưởng': 6,
  'chuyên viên chính': 7, 'chuyên viên': 8,
  'cán sự': 9, 'nhân viên': 10,
  'kế toán trưởng': 3, 'kế toán': 8,
};

function getPositionRank(position: string): number {
  const lower = position.toLowerCase().trim();
  for (const [key, rank] of Object.entries(POSITION_RANK)) {
    if (lower.includes(key)) return rank;
  }
  return 99;
}

function fmt(n: number) { return n.toLocaleString('vi-VN'); }

export function PrintStaffList() {
  const orgSettings = getOrgSettings();
  const settings = getStaffSettings();
  const list = getStaffList();

  // Group by department (tổ công đoàn), sort by position rank
  const grouped = useMemo(() => {
    const map: Record<string, StaffMember[]> = {};
    for (const s of list) {
      const dept = s.department || 'Chưa phân tổ';
      if (!map[dept]) map[dept] = [];
      map[dept].push(s);
    }
    // Sort each group by position rank
    for (const dept of Object.keys(map)) {
      map[dept].sort((a, b) => getPositionRank(a.position) - getPositionRank(b.position));
    }
    return map;
  }, [list]);

  const deptNames = Object.keys(grouped).sort();
  const totalFee = list.reduce((sum, s) => {
    const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, settings);
    return sum + calculateUnionFee(lbh, settings.baseSalary);
  }, 0);

  let stt = 0;

  return (
    <div className="print-content p-4" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', color: '#000' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>{orgSettings.orgName}</p>
        <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>{orgSettings.orgSubName}</p>
        <div style={{ width: '80px', borderBottom: '2px solid #000', margin: '8px auto' }}></div>
        <p style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '16px' }}>
          DANH SÁCH ĐOÀN VIÊN CÔNG ĐOÀN
        </p>
        <p style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>
          (Sắp xếp theo Tổ Công đoàn)
        </p>
      </div>

      {/* Salary info */}
      <div style={{ marginBottom: '12px', fontSize: '12px' }}>
        <p>Lương tối thiểu: <strong>{fmt(settings.minimumSalary)} đ</strong> | Lương vùng: <strong>{fmt(settings.regionalSalary)} đ</strong> | Lương cơ sở: <strong>{fmt(settings.baseSalary)} đ</strong></p>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            {['STT', 'Họ và tên', 'Chức vụ', 'Ngày sinh', 'GT', 'HS lương', 'HS CV', 'Lương BH', 'Đoàn phí CĐ'].map((h, i) => (
              <th key={i} style={{
                border: '1px solid #000', padding: '4px 6px', textAlign: 'center',
                fontWeight: 'bold', backgroundColor: '#f0f0f0',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deptNames.map(dept => {
            const members = grouped[dept];
            const deptFee = members.reduce((sum, s) => {
              const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, settings);
              return sum + calculateUnionFee(lbh, settings.baseSalary);
            }, 0);

            return (
              <> 
                {/* Department header row */}
                <tr key={`dept-${dept}`}>
                  <td colSpan={9} style={{
                    border: '1px solid #000', padding: '5px 8px',
                    fontWeight: 'bold', backgroundColor: '#e8e8e8', fontSize: '12px',
                  }}>
                    {dept}
                  </td>
                </tr>
                {members.map(s => {
                  stt++;
                  const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, settings);
                  const fee = calculateUnionFee(lbh, settings.baseSalary);
                  return (
                    <tr key={s.id}>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'center' }}>{stt}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{s.fullName}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{s.position}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'center' }}>
                        {s.birthDate ? new Date(s.birthDate).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'center' }}>
                        {s.gender === 'nam' ? 'Nam' : 'Nữ'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>{s.salaryCoefficient.toFixed(2)}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>{s.positionCoefficient.toFixed(2)}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>{fmt(Math.round(lbh))}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>{fmt(Math.round(fee))}</td>
                    </tr>
                  );
                })}
                {/* Subtotal per department */}
                <tr key={`sub-${dept}`}>
                  <td colSpan={7} style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold', fontStyle: 'italic', fontSize: '11px' }}>
                    Cộng {dept}: {members.length} đoàn viên
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    {fmt(Math.round(members.reduce((s, m) => s + calculateInsuranceSalary(m.salaryCoefficient, m.positionCoefficient, settings), 0)))}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                    {fmt(Math.round(deptFee))}
                  </td>
                </tr>
              </>
            );
          })}
          {/* Grand total */}
          <tr>
            <td colSpan={7} style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              TỔNG CỘNG: {list.length} đoàn viên
            </td>
            <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              {fmt(Math.round(list.reduce((s, m) => s + calculateInsuranceSalary(m.salaryCoefficient, m.positionCoefficient, settings), 0)))}
            </td>
            <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              {fmt(Math.round(totalFee))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '13px' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ fontWeight: 'bold' }}>PHỤ TRÁCH KẾ TOÁN</p>
          <p style={{ fontStyle: 'italic', fontSize: '11px' }}>(Ký, họ tên)</p>
          <div style={{ height: '60px' }}></div>
          <p style={{ fontWeight: 'bold' }}>{orgSettings.accountantName}</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ fontWeight: 'bold' }}>CHỦ TỊCH CÔNG ĐOÀN</p>
          <p style={{ fontStyle: 'italic', fontSize: '11px' }}>(Ký, họ tên)</p>
          <div style={{ height: '60px' }}></div>
          <p style={{ fontWeight: 'bold' }}>{orgSettings.leaderName}</p>
        </div>
      </div>
    </div>
  );
}
