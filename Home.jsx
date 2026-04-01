import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../App'
import { IC, StatusIcons } from '../components/Icons'
import { yen, calcRate, toYM, rateColor, calcStreak, todayStr } from '../utils/helpers'

const APPS = [
  {id:'ubereats', name:'Uber Eats',    color:'#06C167', bg:'#E8FFF2', initial:'U'},
  {id:'demaekan', name:'出前館',       color:'#FF3B30', bg:'#FFF0F0', initial:'出'},
  {id:'wolt',     name:'Wolt',         color:'#009DE0', bg:'#E8F5FF', initial:'W'},
  {id:'menu',     name:'menu',         color:'#FF6900', bg:'#FFF5E8', initial:'M'},
  {id:'rocket',   name:'ロケットなう',  color:'#5B4EFF', bg:'#F0EEFF', initial:'R'},
  {id:'hakobin',  name:'はこびん',     color:'#00B288', bg:'#E8FFF8', initial:'H'},
]
const appById = id => APPS.find(a=>a.id===id)||APPS[0]

export default function Home() {
  const { profile, isAdmin } = useAuth()
  const { records, expenses, settings } = useAppData()
  const navigate = useNavigate()
  const [dismissedIds, setDismissed] = useState(() => {
    try{return JSON.parse(localStorage.getItem('dlm_dismissed')||'[]')}catch{return[]}
  })

  const thisMonth = useMemo(()=>{const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`},[])
  const prevMonth = useMemo(()=>{const n=new Date();n.setMonth(n.getMonth()-1);return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`},[])

  const mRecs  = useMemo(()=>records.filter(r=>toYM(r.date)===thisMonth),[records,thisMonth])
  const pRecs  = useMemo(()=>records.filter(r=>toYM(r.date)===prevMonth),[records,prevMonth])
  const mExps  = useMemo(()=>expenses.filter(e=>toYM(e.date)===thisMonth),[expenses,thisMonth])
  const mEarn  = mRecs.reduce((s,r)=>s+r.earnings,0)
  const pEarn  = pRecs.reduce((s,r)=>s+r.earnings,0)
  const mExp   = mExps.reduce((s,e)=>s+e.amount,0)
  const mHrs   = mRecs.reduce((s,r)=>s+r.hours,0)
  const mNet   = mEarn-mExp
  const mRate  = calcRate(mEarn,mHrs)
  const goal   = settings.goal||100000
  const gPct   = Math.min(100,Math.round(mEarn/goal*100))
  const streak = useMemo(()=>calcStreak(records),[records])
  const diffPct= pEarn>0?Math.round((mEarn-pEarn)/pEarn*100):0
  const recent = [...records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3)
  const hasToday=records.some(r=>r.date===todayStr())

  const QUICK = [
    {label:'タイマー',to:'/timer',   icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="var(--red)" strokeWidth="2"/><path d="M11 7V11L14 14" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"/></svg>,bg:'#FFF0F1'},
    {label:'記録',    to:'/records', icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="2" width="16" height="18" rx="2" stroke="var(--green)" strokeWidth="2"/><path d="M7 8H15M7 12H15M7 16H11" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round"/></svg>,bg:'var(--greenLt)'},
    {label:'分析',    to:'/analysis',icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 15L7 9L11 12L18 4" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 19H19" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"/></svg>,bg:'var(--blueLt)'},
    {label:'税金',    to:'/tax',     icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="14" rx="2" stroke="var(--orange)" strokeWidth="2"/><path d="M7 10H10M7 14H9" stroke="var(--orange)" strokeWidth="1.8" strokeLinecap="round"/><circle cx="15" cy="10" r="2" fill="var(--orange)"/><path d="M12 14H17" stroke="var(--orange)" strokeWidth="1.5" strokeLinecap="round"/></svg>,bg:'var(--orangeLt)'},
  ]

  return (
    <div className="page fade-in">
      {/* ── ヘッダー（赤） ── */}
      <div style={{ background:'var(--red)', paddingBottom:20 }}>
        {/* ステータスバー */}
        <div style={{ height:48, display:'flex', alignItems:'center',
          justifyContent:'space-between', padding:'0 20px' }}>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'Inter,sans-serif' }}>
            {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2,'0')}
          </span>
          <StatusIcons/>
        </div>

        {/* ヘッダートップ */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'0 20px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, background:'rgba(0,0,0,0.2)',
              borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {IC.bike('white', 18)}
            </div>
            <span style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:2,
              fontFamily:'Inter,sans-serif' }}>DELIMANE</span>
            {isAdmin && (
              <span onClick={()=>navigate('/admin')}
                style={{ fontSize:10, fontWeight:700, color:'var(--red)',
                  background:'#fff', padding:'2px 8px', borderRadius:20, cursor:'pointer' }}>
                管理
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:32, height:32, background:'rgba(255,255,255,0.15)',
              borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {IC.bell}
            </div>
            <div onClick={()=>navigate('/my')}
              style={{ width:32, height:32, background:'#fff', borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:900, color:'var(--red)', cursor:'pointer' }}>
              {(settings.name||'R')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* 残高カード */}
        <div style={{ margin:'0 20px', background:'rgba(0,0,0,0.15)',
          border:'1px solid rgba(255,255,255,0.12)', borderRadius:18, padding:'16px 18px' }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600, marginBottom:5 }}>
            {new Date().getMonth()+1}月の収益
          </div>
          <div style={{ fontSize:42, fontWeight:900, color:'#fff', letterSpacing:-2,
            lineHeight:1, marginBottom:14, fontFamily:'Inter,sans-serif' }}>
            <span style={{ fontSize:20, fontWeight:700, marginRight:2, verticalAlign:3 }}>¥</span>
            {mEarn.toLocaleString()}
          </div>

          {/* 3列 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
            borderTop:'1px solid rgba(255,255,255,0.15)', paddingTop:12 }}>
            {[
              ['時給',   mRate>0?`¥${mRate.toLocaleString()}/h`:'—'],
              ['純利益', yen(mNet)],
              ['稼働',   `${mHrs}h`],
            ].map(([l,v],i)=>(
              <div key={l} style={{ textAlign:'center',
                borderRight:i<2?'1px solid rgba(255,255,255,0.15)':'none' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#fff',
                  fontFamily:'Inter,sans-serif' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* 先月比 */}
          {pEarn > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:600 }}>先月比</span>
              <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.15)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(100,Math.abs(diffPct))}%`,
                  background:'rgba(255,255,255,0.6)', borderRadius:2 }}/>
              </div>
              <span style={{ fontSize:10, fontWeight:700,
                color: diffPct>=0?'rgba(255,255,255,0.9)':'rgba(255,200,200,0.9)' }}>
                {diffPct>=0?'+':''}{diffPct}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── クイックアクション ── */}
      <div style={{ display:'flex', gap:8, padding:'14px 20px',
        background:'var(--white)', borderBottom:'1px solid var(--g2)' }}>
        {QUICK.map(({label,to,icon,bg})=>(
          <div key={to} onClick={()=>navigate(to)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              gap:7, padding:'12px 4px', background:bg, borderRadius:14,
              border:'1px solid rgba(0,0,0,0.05)', cursor:'pointer' }}>
            <div style={{ width:42, height:42, borderRadius:12,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(255,255,255,0.7)' }}>
              {icon}
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--dark)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── 未記録バナー ── */}
      {!hasToday && new Date().getHours()>=10 && (
        <div onClick={()=>navigate('/timer')}
          style={{ margin:'8px 20px 0', background:'#FFF8F0',
            border:'1.5px solid #FFD4A8', borderRadius:14, padding:'12px 14px',
            display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div style={{ width:36, height:36, background:'var(--red)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {IC.timer('white')}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#C04800' }}>今日の記録がありません</div>
            <div style={{ fontSize:11, color:'#A06030', marginTop:1 }}>タップしてタイマーを開始</div>
          </div>
          {IC.chevron}
        </div>
      )}

      {/* ── 目標 ── */}
      <div style={{ background:'var(--white)', marginTop:8, padding:'14px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--g4)', marginBottom:2 }}>月間目標 ¥{goal.toLocaleString()}</div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--dark)',
              fontFamily:'Inter,sans-serif' }}>¥{mEarn.toLocaleString()} 達成中</div>
          </div>
          <div style={{ fontSize:30, fontWeight:900, color:'var(--red)',
            fontFamily:'Inter,sans-serif', lineHeight:1 }}>{gPct}%</div>
        </div>
        <div style={{ height:6, background:'var(--g2)', borderRadius:3, overflow:'hidden', marginBottom:7 }}>
          <div style={{ height:'100%', width:`${gPct}%`, background:'var(--red)',
            borderRadius:3, transition:'width 1.2s ease' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--g4)' }}>
          <span>残り ¥{Math.max(0,goal-mEarn).toLocaleString()}</span>
          <span>{gPct>=100?'🎉 達成！':`約${Math.ceil(Math.max(0,goal-mEarn)/Math.max(1,mRate))}h で達成見込み`}</span>
        </div>
      </div>

      <div className="sep-block"/>

      {/* ── ストリーク ── */}
      {streak > 1 && (
        <div style={{ background:'var(--white)', padding:'12px 20px',
          display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid var(--g2)' }}>
          <div style={{ width:40, height:40, background:'#FFF0F1', borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🔥</div>
          <div>
            <span style={{ fontSize:15, fontWeight:900, color:'var(--red)',
              fontFamily:'Inter,sans-serif' }}>{streak}</span>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--dark)' }}> 日連続稼働中</span>
            <div style={{ fontSize:11, color:'var(--g4)', marginTop:1 }}>この調子で続けよう！</div>
          </div>
        </div>
      )}

      {/* ── 直近の稼働 ── */}
      <div style={{ background:'var(--white)', marginTop:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'14px 20px 10px' }}>
          <span style={{ fontSize:15, fontWeight:700 }}>直近の稼働</span>
          <span onClick={()=>navigate('/records')}
            style={{ fontSize:13, fontWeight:700, color:'var(--red)', cursor:'pointer' }}>
            すべて見る
          </span>
        </div>

        {recent.length===0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🛵</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--dark)', marginBottom:4 }}>
              {settings.name}さん、記録を始めましょう
            </div>
            <div style={{ fontSize:12, color:'var(--g4)' }}>右下の ＋ ボタンから記録できます</div>
          </div>
        ) : recent.map((r, i) => {
          const rv = calcRate(r.earnings, r.hours)
          const apps = (r.apps||[]).map(appById)
          return (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12,
              padding:'13px 20px', borderTop:'1px solid var(--g2)' }}>
              <div style={{ width:44, height:44, borderRadius:13, flexShrink:0,
                background: apps[0]?.bg||'var(--g1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, fontWeight:900, color:apps[0]?.color||'var(--g4)' }}>
                {apps[0]?.initial||'?'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>
                  {apps.map(a=>a.name).join(' + ')}
                </div>
                <div style={{ fontSize:11, color:'var(--g4)' }}>
                  {r.date} · {r.hours}h稼働
                  {r.distance>0&&` · ${r.distance}km`}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:17, fontWeight:900, fontFamily:'Inter,sans-serif' }}>
                  ¥{r.earnings.toLocaleString()}
                </div>
                <div style={{ fontSize:11, fontWeight:700, marginTop:2,
                  color:rateColor(rv), fontFamily:'Inter,sans-serif' }}>
                  ¥{rv.toLocaleString()}/h
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}