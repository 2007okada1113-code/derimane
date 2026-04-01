import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAppData } from '../App'
import { yen, calcRate, toYM, ymLabel, rateColor } from '../utils/helpers'

const APPS=[{id:'ubereats',name:'Uber Eats',color:'#06C167'},{id:'demaekan',name:'出前館',color:'#FF3B30'},{id:'wolt',name:'Wolt',color:'#009DE0'},{id:'menu',name:'menu',color:'#FF6900'},{id:'rocket',name:'ロケットなう',color:'#5B4EFF'},{id:'hakobin',name:'はこびん',color:'#00B288'}]
const DAYS=['日','月','火','水','木','金','土']
const SLOTS=[{key:'morning',label:'朝',sub:'6〜11時'},{key:'lunch',label:'昼',sub:'11〜15時'},{key:'evening',label:'夕',sub:'15〜19時'},{key:'night',label:'夜',sub:'19〜24時'}]
const TABS=[['incentive','内訳'],['daily','日別'],['dow','曜日'],['slot','時間帯'],['app','アプリ'],['comp','月比較']]

const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length)return null
  return <div style={{background:'#fff',border:'1px solid #EBEBEB',borderRadius:8,padding:'7px 11px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',fontSize:12,fontFamily:'Inter,sans-serif'}}>
    <div style={{color:'#8A8A8A',marginBottom:2}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{fontWeight:700,color:p.color||'#111',fontFamily:'Inter,sans-serif'}}>¥{p.value?.toLocaleString()}</div>)}
  </div>
}

export default function Analysis() {
  const { records, expenses } = useAppData()
  const [sub, setSub] = useState('incentive')

  const months = useMemo(()=>[...new Set(records.map(r=>toYM(r.date)))].sort((a,b)=>b.localeCompare(a)),[records])
  const [selM,setSelM] = useState(()=>{const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`})
  const actM = months.includes(selM)?selM:(months[0]??selM)

  const mRecs = useMemo(()=>records.filter(r=>toYM(r.date)===actM).sort((a,b)=>a.date.localeCompare(b.date)),[records,actM])
  const mExps = useMemo(()=>expenses.filter(e=>toYM(e.date)===actM),[expenses,actM])
  const mEarn = mRecs.reduce((s,r)=>s+r.earnings,0)
  const mExp  = mExps.reduce((s,e)=>s+e.amount,0)
  const mHrs  = mRecs.reduce((s,r)=>s+r.hours,0)
  const mNet  = mEarn-mExp
  const mBase = mRecs.reduce((s,r)=>s+(r.base_earnings||r.earnings),0)
  const mBoost= mRecs.reduce((s,r)=>s+(r.boost||0),0)
  const mQuest= mRecs.reduce((s,r)=>s+(r.quest||0),0)
  const mTip  = mRecs.reduce((s,r)=>s+(r.tip||0),0)

  const last7  = useMemo(()=>mRecs.slice(-7).map(r=>({lbl:r.date.slice(5).replace('-','/'),収益:r.earnings,rate:calcRate(r.earnings,r.hours)})),[mRecs])
  const dowD   = useMemo(()=>{const a=Array(7).fill(0).map(()=>({t:0,n:0}));mRecs.forEach(r=>{const d=new Date(r.date).getDay();a[d].t+=r.earnings;a[d].n++});return DAYS.map((l,i)=>({l,avg:a[i].n?Math.round(a[i].t/a[i].n):0}))},[mRecs])
  const slotD  = useMemo(()=>SLOTS.map(s=>{const rs=records.filter(r=>r.time_slot===s.key);return{...s,r:calcRate(rs.reduce((x,r)=>x+r.earnings,0),rs.reduce((x,r)=>x+r.hours,0)),n:rs.length}}),[records])
  const appD   = useMemo(()=>{const a={};APPS.forEach(x=>{a[x.id]={e:0,h:0,n:0}});mRecs.forEach(r=>(r.apps||[]).forEach(id=>{if(a[id]){a[id].e+=r.earnings/((r.apps||[]).length||1);a[id].h+=r.hours/((r.apps||[]).length||1);a[id].n++}}));return APPS.filter(x=>a[x.id].n>0).map(x=>({...x,r:calcRate(a[x.id].e,a[x.id].h),t:Math.round(a[x.id].e),d:a[x.id].n})).sort((a,b)=>b.r-a.r)},[mRecs])
  const compD  = useMemo(()=>{const ms=[...new Set(records.map(r=>toYM(r.date)))].sort((a,b)=>a.localeCompare(b)).slice(-5);return ms.map(ym=>{const r=records.filter(x=>toYM(x.date)===ym),e=expenses.filter(x=>toYM(x.date)===ym);const earn=r.reduce((s,x)=>s+x.earnings,0),exp=e.reduce((s,x)=>s+x.amount,0),hrs=r.reduce((s,x)=>s+x.hours,0);return{lbl:ymLabel(ym).replace(/20\d\d年/,''),収益:earn,純利益:earn-exp,時給:calcRate(earn,hrs)}})},[records,expenses])

  const Empty = ()=><div style={{textAlign:'center',padding:'48px 20px'}}><div style={{fontSize:36,marginBottom:10}}>📊</div><div style={{fontSize:14,color:'var(--g4)'}}>記録がありません</div></div>

  return (
    <div className="page fade-in">
      {/* ヘッダー */}
      <div style={{background:'var(--white)',borderBottom:'1px solid var(--g2)',padding:'52px 20px 0'}}>
        <div style={{height:52,display:'flex',alignItems:'center'}}>
          <span style={{fontSize:18,fontWeight:900}}>分析</span>
        </div>
        {/* サブタブ */}
        <div style={{display:'flex',gap:0,overflowX:'auto',scrollbarWidth:'none',paddingBottom:0}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setSub(k)}
              style={{flexShrink:0,padding:'10px 14px',background:'none',border:'none',
                borderBottom:`2.5px solid ${sub===k?'var(--red)':'transparent'}`,
                fontSize:13,fontWeight:700,color:sub===k?'var(--red)':'var(--g4)',cursor:'pointer',whiteSpace:'nowrap'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 月セレクター（月比較・時間帯以外） */}
      {sub!=='comp'&&sub!=='slot'&&(
        <div className="month-scroll">
          {months.map(ym=>(
            <button key={ym} onClick={()=>setSelM(ym)} className={`mchip ${actM===ym?'on':'off'}`}>{ymLabel(ym)}</button>
          ))}
        </div>
      )}

      {/* ── 内訳 ── */}
      {sub==='incentive'&&(mRecs.length===0?<Empty/>:<>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'14px 20px',background:'var(--white)',borderBottom:'8px solid var(--g1)'}}>
          {[['基本料金',yen(mBase),'var(--dark)'],['ブースト',yen(mBoost),'var(--blue)'],['クエスト',yen(mQuest),'#B45309'],['チップ',yen(mTip),'var(--green)'],['純利益',yen(mNet),mNet>=0?'var(--green)':'var(--red)'],['真の時給',`${yen(calcRate(mNet,mHrs))}/h`,rateColor(calcRate(mNet,mHrs))]].map(([l,v,c])=>(
            <div key={l} style={{background:'var(--g1)',borderRadius:12,padding:'12px 14px',border:'1px solid var(--g2)'}}>
              <div style={{fontSize:11,color:'var(--g4)',marginBottom:4}}>{l}</div>
              <div style={{fontSize:17,fontWeight:900,color:c,fontFamily:'Inter,sans-serif'}}>{v}</div>
            </div>
          ))}
        </div>
        {mBoost+mQuest+mTip>0&&(
          <div style={{background:'var(--white)',padding:'14px 20px'}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>収益内訳（直近7日）</div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={mRecs.slice(-7).map(r=>({lbl:r.date.slice(5).replace('-','/'),基本:r.base_earnings||r.earnings,ブースト:r.boost||0,クエスト:r.quest||0,チップ:r.tip||0}))} margin={{top:2,right:0,left:-24,bottom:0}}>
                <XAxis dataKey="lbl" tick={{fill:'#8A8A8A',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#8A8A8A',fontSize:9}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="基本" stackId="a" fill="#EBEBEB"/>
                <Bar dataKey="ブースト" stackId="a" fill="var(--blue)"/>
                <Bar dataKey="クエスト" stackId="a" fill="#B45309"/>
                <Bar dataKey="チップ" stackId="a" fill="var(--green)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </>)}

      {/* ── 日別 ── */}
      {sub==='daily'&&(mRecs.length===0?<Empty/>:<>
        <div style={{background:'var(--white)',padding:'14px 20px',borderBottom:'8px solid var(--g1)'}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>時給推移</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={last7} margin={{top:4,right:8,left:-24,bottom:0}}>
              <XAxis dataKey="lbl" tick={{fill:'#8A8A8A',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#8A8A8A',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Line type="monotone" dataKey="rate" name="時給" stroke="var(--red)" strokeWidth={2.5} dot={{fill:'var(--red)',r:4,strokeWidth:0}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:'var(--white)'}}>
          {[...mRecs].reverse().map((r,i)=>{const rv=calcRate(r.earnings,r.hours);return(
            <div key={r.id} style={{padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:11,color:'var(--g4)',fontFamily:'Inter,sans-serif',marginBottom:3}}>{r.date}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {(r.apps||[]).map(id=>{const a=APPS.find(x=>x.id===id);return a?<span key={id} style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:5,background:a.color+'18',color:a.color}}>{a.name}</span>:null})}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:16,fontWeight:900,fontFamily:'Inter,sans-serif'}}>¥{r.earnings.toLocaleString()}</div>
                <div style={{fontSize:11,fontWeight:700,marginTop:1,color:rateColor(rv),fontFamily:'Inter,sans-serif'}}>¥{rv.toLocaleString()}/h</div>
              </div>
            </div>
          )})}
        </div>
      </>)}

      {/* ── 曜日 ── */}
      {sub==='dow'&&(mRecs.length===0?<Empty/>:<>
        <div style={{background:'var(--white)',padding:'14px 20px',borderBottom:'8px solid var(--g1)'}}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dowD} margin={{top:2,right:0,left:-24,bottom:0}}>
              <XAxis dataKey="l" tick={{fill:'#8A8A8A',fontSize:13,fontWeight:600}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#8A8A8A',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="avg" name="平均収益" radius={[5,5,0,0]}>
                {dowD.map((d,i)=><Cell key={i} fill={d.avg===Math.max(...dowD.map(x=>x.avg))&&d.avg>0?'var(--red)':'#EBEBEB'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'14px 20px',background:'var(--white)'}}>
          {dowD.map(d=>(
            <div key={d.l} style={{background:'var(--g1)',borderRadius:12,padding:'11px 8px',textAlign:'center',border:'1px solid var(--g2)'}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{d.l}</div>
              <div style={{fontSize:12,fontWeight:700,color:d.avg>0?'var(--dark)':'var(--g3)',fontFamily:'Inter,sans-serif'}}>{d.avg>0?yen(d.avg):'—'}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── 時間帯 ── */}
      {sub==='slot'&&(
        <div style={{background:'var(--white)'}}>
          {slotD.map((s,i)=>(
            <div key={s.key} style={{padding:'14px 20px',borderTop:i>0?'1px solid var(--g2)':'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:s.n>0?10:0}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>{s.label}<span style={{fontSize:11,color:'var(--g4)',marginLeft:6,fontWeight:500}}>{s.sub}</span></div>
                  <div style={{fontSize:11,color:'var(--g4)',marginTop:1}}>{s.n}回</div>
                </div>
                <span style={{fontSize:16,fontWeight:900,color:s.n>0?rateColor(s.r):'var(--g3)',fontFamily:'Inter,sans-serif'}}>{s.n>0?`¥${s.r.toLocaleString()}/h`:'—'}</span>
              </div>
              {s.n>0&&<div style={{height:5,background:'var(--g2)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,(s.r/2500)*100)}%`,background:rateColor(s.r),borderRadius:3}}/></div>}
            </div>
          ))}
        </div>
      )}

      {/* ── アプリ ── */}
      {sub==='app'&&(appD.length===0?<Empty/>:
        <div style={{background:'var(--white)'}}>
          {appD.map((a,i)=>(
            <div key={a.id} style={{padding:'14px 20px',borderTop:i>0?'1px solid var(--g2)':'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:6,background:a.color+'18',color:a.color}}>{a.name}</span>
                  {i===0&&<span style={{fontSize:10,fontWeight:700,color:'var(--green)',background:'var(--greenLt)',padding:'2px 7px',borderRadius:5}}>No.1</span>}
                </div>
                <span style={{fontSize:16,fontWeight:900,color:rateColor(a.r),fontFamily:'Inter,sans-serif'}}>¥{a.r.toLocaleString()}/h</span>
              </div>
              <div style={{display:'flex',gap:16,marginBottom:8}}>
                {[['合計',yen(a.t)],['稼働日',`${a.d}日`]].map(([l,v])=>(
                  <div key={l}><div style={{fontSize:10,color:'var(--g4)',marginBottom:1}}>{l}</div><div style={{fontSize:13,fontWeight:700,fontFamily:'Inter,sans-serif'}}>{v}</div></div>
                ))}
              </div>
              <div style={{height:4,background:'var(--g2)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,(a.r/2200)*100)}%`,background:a.color,borderRadius:2}}/></div>
            </div>
          ))}
        </div>
      )}

      {/* ── 月比較 ── */}
      {sub==='comp'&&(compD.length===0?<Empty/>:<>
        <div style={{background:'var(--white)',padding:'14px 20px',borderBottom:'8px solid var(--g1)'}}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={compD} margin={{top:2,right:4,left:-24,bottom:0}} barGap={3}>
              <XAxis dataKey="lbl" tick={{fill:'#8A8A8A',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#8A8A8A',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="収益" radius={[3,3,0,0]} fill="#EBEBEB"/>
              <Bar dataKey="純利益" radius={[3,3,0,0]} fill="var(--red)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:'var(--white)'}}>
          {compD.map((d,i)=>(
            <div key={d.lbl} style={{padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:14,fontWeight:700}}>{d.lbl}</span>
              <div style={{display:'flex',gap:16}}>
                {[['収益',yen(d.収益),'var(--dark)'],['純利益',yen(d.純利益),'var(--green)'],['時給',`¥${d.時給.toLocaleString()}/h`,rateColor(d.時給)]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:'right'}}><div style={{fontSize:10,color:'var(--g4)',marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:c,fontFamily:'Inter,sans-serif'}}>{v}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  )
}