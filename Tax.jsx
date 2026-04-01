import { useState, useMemo } from 'react'
import { useAppData } from '../App'
import { yen, calcTax } from '../utils/helpers'

export default function Tax() {
  const { records, expenses, settings, updateSettings } = useAppData()

  const annualEarnings = useMemo(()=>records.reduce((s,r)=>s+r.earnings,0),[records])
  const annualExpenses = useMemo(()=>expenses.reduce((s,e)=>s+e.amount,0),[expenses])

  const tax = useMemo(()=>calcTax({
    annualEarnings, annualExpenses,
    employmentType: settings.employment_type||'freelance',
    otherIncome:    settings.other_annual_income||0,
    blueReturn:     settings.blue_return||false,
    hasDependent:   settings.has_dependent||false,
  }),[annualEarnings,annualExpenses,settings])

  const thisMonthEarn = useMemo(()=>{
    const ym=new Date().toISOString().slice(0,7)
    return records.filter(r=>r.date?.slice(0,7)===ym).reduce((s,r)=>s+r.earnings,0)
  },[records])

  const iS={width:'100%',border:'1.5px solid var(--g2)',borderRadius:14,padding:'12px 14px',fontSize:15,fontWeight:600,color:'var(--dark)',background:'#FAFAFA',outline:'none',boxSizing:'border-box'}

  return (
    <div className="page fade-in">
      {/* ヘッダー */}
      <div style={{background:'var(--white)',borderBottom:'1px solid var(--g2)',padding:'52px 20px 14px'}}>
        <span style={{fontSize:18,fontWeight:900}}>税金サポート</span>
      </div>

      {/* 確定申告判定 */}
      <div style={{padding:'12px 20px 0'}}>
        <div style={{
          background: tax.needsReturn?'#FFF0F1':'var(--greenLt)',
          border:`1.5px solid ${tax.needsReturn?'#FFD0D4':'#A7F3D0'}`,
          borderRadius:16,padding:'14px 16px',marginBottom:0,
        }}>
          <div style={{fontSize:15,fontWeight:700,color:tax.needsReturn?'var(--red)':'var(--green)',marginBottom:5}}>
            {tax.needsReturn?'⚠️ 確定申告が必要です':'✓ 現時点では確定申告不要の見込みです'}
          </div>
          <div style={{fontSize:12,color:tax.needsReturn?'#C04800':'#166534',lineHeight:1.7}}>
            {settings.employment_type==='employee'
              ?'副業所得が20万円を超えているため確定申告が必要です'
              :'所得が基礎控除（48万円）を超えているため確定申告が必要です'}
            {settings.blue_return&&'（青色申告控除65万円適用中）'}
          </div>
        </div>
      </div>

      {/* 税額シミュレーション */}
      <div style={{background:'var(--white)',marginTop:8}}>
        <div style={{padding:'14px 20px 4px'}}>
          <div style={{fontSize:15,fontWeight:700}}>年間税額シミュレーション</div>
          <div style={{fontSize:11,color:'var(--g4)',marginTop:2}}>全記録から推計（簡易計算）</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'10px 20px 16px'}}>
          {[
            ['年間配達収益', yen(annualEarnings), 'var(--dark)'],
            ['年間経費',     yen(annualExpenses), 'var(--red)'],
            ['配達所得',     yen(tax.profit),     'var(--dark)'],
            ['所得税（推計）',yen(tax.income),    '#7C3AED'],
            ['住民税（推計）',yen(tax.resident),  'var(--blue)'],
            ...(tax.biz>0?[['個人事業税',yen(tax.biz),'var(--orange)']]:[] ),
            ['合計税額',     yen(tax.total),      'var(--red)'],
            ['月の積立額',   yen(tax.monthly),    'var(--orange)'],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:'var(--g1)',borderRadius:12,padding:'11px 13px',border:'1px solid var(--g2)'}}>
              <div style={{fontSize:10,color:'var(--g4)',fontWeight:600,marginBottom:3}}>{l}</div>
              <div style={{fontSize:16,fontWeight:900,color:c,fontFamily:'Inter,sans-serif'}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 使えるお金 */}
      <div style={{background:'var(--white)',marginTop:8,padding:'14px 20px'}}>
        <div style={{fontSize:11,color:'var(--g4)',marginBottom:5}}>今月の「使えるお金」</div>
        <div style={{fontSize:30,fontWeight:900,color:'var(--green)',fontFamily:'Inter,sans-serif',marginBottom:4}}>
          {yen(Math.max(0,thisMonthEarn-tax.monthly))}
        </div>
        <div style={{fontSize:12,color:'var(--g4)'}}>
          今月収益 {yen(thisMonthEarn)} − 月積立 {yen(tax.monthly)}
        </div>
      </div>

      <div className="sep-block"/>

      {/* 税務設定 */}
      <div style={{background:'var(--white)',padding:'14px 20px'}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>税務設定</div>

        {/* 本業/副業 */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--g4)',marginBottom:8}}>配達は本業ですか？</div>
          <div style={{display:'flex',gap:8}}>
            {[['freelance','本業・個人事業主'],['employee','副業・会社員']].map(([v,l])=>(
              <button key={v} onClick={()=>updateSettings({employment_type:v})}
                style={{flex:1,padding:'12px 6px',borderRadius:14,cursor:'pointer',
                  border:`1.5px solid ${settings.employment_type===v?'var(--red)':'var(--g2)'}`,
                  background:settings.employment_type===v?'#FFF0F1':'#FAFAFA',
                  color:settings.employment_type===v?'var(--red)':'var(--g5)',
                  fontSize:12,fontWeight:700}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 青色申告 */}
        {settings.employment_type==='freelance'&&(
          <div onClick={()=>updateSettings({blue_return:!settings.blue_return})}
            style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:14,
              border:`1.5px solid ${settings.blue_return?'var(--red)':'var(--g2)'}`,
              background:settings.blue_return?'#FFF0F1':'#FAFAFA',cursor:'pointer',marginBottom:12}}>
            <div style={{width:22,height:22,borderRadius:6,flexShrink:0,
              border:`2px solid ${settings.blue_return?'var(--red)':'var(--g2)'}`,
              background:settings.blue_return?'var(--red)':'transparent',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {settings.blue_return&&<span style={{fontSize:12,color:'#fff',fontWeight:700}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>青色申告をしている（or する予定）</div>
              <div style={{fontSize:11,color:'var(--g4)',marginTop:1}}>最大65万円の特別控除が使えます</div>
            </div>
          </div>
        )}

        {/* 副業の場合：給与収入 */}
        {settings.employment_type==='employee'&&(
          <div style={{marginBottom:12}}>
            <label className="field-label">年間給与収入（任意）</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:16,fontWeight:700,color:'var(--g4)'}}>¥</span>
              <input style={{...iS,paddingLeft:28}} type="number" placeholder="3000000"
                value={settings.other_annual_income||''}
                onChange={e=>updateSettings({other_annual_income:Number(e.target.value)||0})}/>
            </div>
            <div style={{fontSize:11,color:'var(--g4)',marginTop:5}}>入力するとより正確な税額を計算できます</div>
          </div>
        )}

        {/* 扶養 */}
        <div onClick={()=>updateSettings({has_dependent:!settings.has_dependent})}
          style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:14,
            border:`1.5px solid ${settings.has_dependent?'var(--green)':'var(--g2)'}`,
            background:settings.has_dependent?'var(--greenLt)':'#FAFAFA',cursor:'pointer'}}>
          <div style={{width:22,height:22,borderRadius:6,flexShrink:0,
            border:`2px solid ${settings.has_dependent?'var(--green)':'var(--g2)'}`,
            background:settings.has_dependent?'var(--green)':'transparent',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            {settings.has_dependent&&<span style={{fontSize:12,color:'#fff',fontWeight:700}}>✓</span>}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>扶養控除あり</div>
            <div style={{fontSize:11,color:'var(--g4)',marginTop:1}}>配偶者・親族の扶養（38万円控除）</div>
          </div>
        </div>
      </div>

      <div style={{padding:'14px 20px',fontSize:11,color:'var(--g4)',lineHeight:1.8,background:'var(--white)',marginTop:8}}>
        ※ このシミュレーションは簡易計算です。正確な申告は税理士にご相談ください。
      </div>
    </div>
  )
}