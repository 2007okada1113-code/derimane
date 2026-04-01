import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useAppData } from '../App'
import { IC } from '../components/Icons'
import { fmtHMS, yen, rateColor, todayStr } from '../utils/helpers'

const APPS=[{id:'ubereats',name:'Uber Eats',color:'#06C167',logo:'🟢'},{id:'demaekan',name:'出前館',color:'#FF3B30',logo:'🔴'},{id:'wolt',name:'Wolt',color:'#009DE0',logo:'🔵'},{id:'menu',name:'menu',color:'#FF6900',logo:'🟠'},{id:'rocket',name:'ロケットなう',color:'#5B4EFF',logo:'🚀'},{id:'hakobin',name:'はこびん',color:'#00B288',logo:'🟩'}]
const SLOTS=[{key:'morning',label:'朝',sub:'6〜11時'},{key:'lunch',label:'昼',sub:'11〜15時'},{key:'evening',label:'夕',sub:'15〜19時'},{key:'night',label:'夜',sub:'19〜24時'}]
const WEATHERS=[{key:'sunny',label:'晴れ',icon:'☀️'},{key:'cloudy',label:'曇り',icon:'☁️'},{key:'rain',label:'雨',icon:'🌧️'},{key:'snow',label:'雪',icon:'❄️'}]

export default function Timer() {
  const { settings }  = useAppData()
  const { addRecord } = useAppData()
  const { show, Toast } = useToast()
  const userApps = APPS.filter(a=>(settings.active_apps||['ubereats']).includes(a.id))

  const [mode,      setMode]     = useState('idle')
  const [workSec,   setWorkSec]  = useState(0)
  const [waitSec,   setWaitSec]  = useState(0)
  const [startTime, setStartTime]= useState(null)
  const [showForm,  setShowForm] = useState(false)
  const [form, setForm] = useState({earnings:'',base_earnings:'',boost:'',quest:'',tip:'',apps:[],memo:'',time_slot:'',weather:'',distance:''})

  const rafRef = useRef(null)
  const base   = useRef({work:0,wait:0,ts:0})

  const tick = useCallback(()=>{
    const diff=Math.floor((Date.now()-base.current.ts)/1000)
    if(mode==='working')setWorkSec(base.current.work+diff)
    if(mode==='waiting')setWaitSec(base.current.wait+diff)
    rafRef.current=requestAnimationFrame(tick)
  },[mode])

  useEffect(()=>{
    if(mode==='idle'||mode==='break'){cancelAnimationFrame(rafRef.current);return}
    base.current.ts=Date.now()
    if(mode==='working')base.current.work=workSec
    if(mode==='waiting')base.current.wait=waitSec
    rafRef.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(rafRef.current)
  },[mode])

  const start   = ()=>{ setStartTime(new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})); setWorkSec(0);setWaitSec(0); setMode('waiting') }
  const toWork  = ()=>{ if(mode==='idle')return; base.current.wait=waitSec; setMode('working') }
  const toWait  = ()=>{ if(mode==='idle')return; base.current.work=workSec; setMode('waiting') }
  const toBreak = ()=>{ if(mode==='idle')return; cancelAnimationFrame(rafRef.current); setMode('break') }
  const end     = ()=>{ cancelAnimationFrame(rafRef.current); if(workSec+waitSec<60){show('稼働時間が短すぎます','warn');return}; setMode('idle'); setShowForm(true) }
  const reset   = ()=>{ if(!window.confirm('リセットしますか？'))return; cancelAnimationFrame(rafRef.current); setMode('idle');setWorkSec(0);setWaitSec(0);setStartTime(null);base.current={work:0,wait:0,ts:0} }

  const total  = workSec+waitSec
  const wPct   = total>0?Math.round(workSec/total*100):50
  const earn   = Number(form.earnings)||0
  const lRate  = earn>0&&total>60?Math.round(earn/(total/3600)):0
  const prvRate= earn>0&&total>0?Math.round(earn/(total/3600)):null

  const togApp = id=>setForm(f=>({...f,apps:f.apps.includes(id)?f.apps.filter(x=>x!==id):[...f.apps,id]}))

  const save = ()=>{
    if(!form.earnings)return show('収益を入力してください','warn')
    if(!form.apps.length)return show('アプリを選択してください','warn')
    const earnings=Number(form.earnings)
    addRecord({date:todayStr(),earnings,base_earnings:form.base_earnings?Number(form.base_earnings):earnings,boost:Number(form.boost||0),quest:Number(form.quest||0),tip:Number(form.tip||0),hours:Number((total/3600).toFixed(2)),wait_hours:Number((waitSec/3600).toFixed(2)),distance:Number(form.distance||0),apps:form.apps,memo:form.memo,time_slot:form.time_slot,weather:form.weather})
    show('記録しました ✓')
    setShowForm(false);setWorkSec(0);setWaitSec(0);setStartTime(null)
    setForm({earnings:'',base_earnings:'',boost:'',quest:'',tip:'',apps:[],memo:'',time_slot:'',weather:'',distance:''})
  }

  const iS={width:'100%',border:'1.5px solid var(--g2)',borderRadius:14,padding:'12px 14px',fontSize:15,fontWeight:600,color:'var(--dark)',background:'#FAFAFA',outline:'none',boxSizing:'border-box'}
  const modeLabel={idle:'未開始',working:'配達中',waiting:'待機中',break:'休憩中'}
  const modeColor={idle:'var(--g4)',working:'var(--green)',waiting:'var(--orange)',break:'var(--blue)'}

  return (
    <div className="page fade-in">
      <Toast/>
      {/* ヘッダー */}
      <div style={{background:'var(--dark)',padding:'52px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',height:104}}>
        <span style={{fontSize:18,fontWeight:900,color:'#fff'}}>タイマー</span>
        <div style={{width:32,height:32,background:'rgba(255,255,255,0.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff'}}>{(settings.name||'R')[0].toUpperCase()}</div>
      </div>

      {/* タイマー表示 */}
      <div style={{background:'var(--dark)',padding:'16px 20px 20px'}}>
        <div style={{marginBottom:16}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,background:modeColor[mode]+'20',border:`1px solid ${modeColor[mode]}40`,borderRadius:20,padding:'5px 14px'}}>
            {mode!=='idle'&&mode!=='break'&&<div style={{width:7,height:7,borderRadius:'50%',background:modeColor[mode],animation:'blink 1.4s ease-in-out infinite'}}/>}
            <span style={{fontSize:12,fontWeight:700,color:modeColor[mode],letterSpacing:.3}}>{modeLabel[mode]}</span>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          {[['稼働時間',workSec,'var(--green)',mode==='working'],['待機時間',waitSec,'#FBB324',mode==='waiting']].map(([l,s,c,act])=>(
            <div key={l} style={{background:act?c+'10':'rgba(255,255,255,0.05)',border:`1px solid ${act?c+'30':'rgba(255,255,255,0.07)'}`,borderRadius:14,padding:'13px 12px'}}>
              <div style={{fontSize:10,color:act?c+'aa':'rgba(255,255,255,0.3)',fontWeight:700,letterSpacing:.5,marginBottom:6,textTransform:'uppercase'}}>{l}{act&&' ▶'}</div>
              <div style={{fontSize:27,fontWeight:900,color:act?c:'rgba(255,255,255,0.2)',letterSpacing:1,fontFamily:'Inter,sans-serif'}}>{fmtHMS(s)}</div>
            </div>
          ))}
        </div>

        <div style={{height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden',display:'flex',marginBottom:5}}>
          <div style={{height:'100%',width:`${wPct}%`,background:'#4ADE80'}}/>
          <div style={{height:'100%',flex:1,background:'#FBB324'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:lRate>0?10:0}}>
          <span style={{fontSize:10,fontWeight:700,color:'#4ADE80'}}>配達 {wPct}%</span>
          <span style={{fontSize:10,fontWeight:700,color:'#FBB324'}}>待機 {100-wPct}%</span>
        </div>
        {lRate>0&&<div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'7px 13px'}}>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.35)',fontWeight:600}}>推定時給</span>
          <span style={{fontSize:16,fontWeight:900,color:'#4ADE80',fontFamily:'Inter,sans-serif'}}>¥{lRate.toLocaleString()}/h</span>
        </div>}
      </div>

      {/* ボタン群 */}
      <div style={{padding:'14px 20px',background:'var(--g1)'}}>
        {mode!=='idle'&&(
          <div style={{display:'flex',alignItems:'center',border:`1.5px solid ${form.earnings?'var(--red)':'var(--g2)'}`,borderRadius:14,overflow:'hidden',marginBottom:10,background:'#fff'}}>
            <span style={{padding:'0 12px',fontSize:17,fontWeight:700,color:'var(--g4)'}}>¥</span>
            <input type="number" inputMode="numeric" placeholder="収益額を入力" value={form.earnings} onChange={e=>setForm(f=>({...f,earnings:e.target.value}))}
              style={{flex:1,border:'none',background:'transparent',padding:'13px 8px 13px 0',fontSize:16,fontWeight:700,color:'var(--dark)',outline:'none',fontFamily:'Inter,sans-serif'}}/>
          </div>
        )}

        {mode==='idle'?(
          <button onClick={start} style={{width:'100%',padding:'17px',background:'var(--red)',border:'none',borderRadius:16,color:'#fff',fontSize:17,fontWeight:900,cursor:'pointer',boxShadow:'0 4px 16px rgba(232,25,44,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3L17 10L4 17V3Z" fill="white"/></svg>
            稼働を開始する
          </button>
        ):(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <button onClick={toWork} style={{padding:'14px',borderRadius:14,cursor:'pointer',background:mode==='working'?'var(--green)':'var(--greenLt)',border:`1.5px solid ${mode==='working'?'var(--green)':'#A7F3D0'}`,color:mode==='working'?'#fff':'var(--green)',fontWeight:700,fontSize:13,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9 8L17 12L9 16V8Z" fill="currentColor"/></svg>
                {mode==='working'?'配達中':'配達開始'}
              </button>
              <button onClick={toWait} style={{padding:'14px',borderRadius:14,cursor:'pointer',background:mode==='waiting'?'#D97706':'#FFFBEB',border:`1.5px solid ${mode==='waiting'?'#D97706':'#FDE68A'}`,color:mode==='waiting'?'#fff':'#D97706',fontWeight:700,fontSize:13,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><rect x="8" y="7" width="3" height="10" rx="1.5" fill="currentColor"/><rect x="13" y="7" width="3" height="10" rx="1.5" fill="currentColor"/></svg>
                {mode==='waiting'?'待機中':'待機へ'}
              </button>
              <button onClick={toBreak} style={{padding:'14px',borderRadius:14,cursor:'pointer',background:mode==='break'?'var(--blue)':'var(--blueLt)',border:`1.5px solid ${mode==='break'?'var(--blue)':'#BFDBFE'}`,color:mode==='break'?'#fff':'var(--blue)',fontWeight:700,fontSize:13,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 18C8 15 10 13 14 13C18 13 20 15 20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M6 18H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M11 13V10M17 13V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 10H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                休憩
              </button>
              <button onClick={end} style={{padding:'14px',borderRadius:14,cursor:'pointer',background:'var(--red)',border:'none',color:'#fff',fontWeight:700,fontSize:13,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/><path d="M8 12L11 15L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                終了・記録
              </button>
            </div>
            <button onClick={reset} style={{width:'100%',padding:'10px',background:'none',border:'1px solid var(--g2)',borderRadius:12,color:'var(--g4)',fontSize:12,cursor:'pointer'}}>リセット</button>
          </>
        )}

        {startTime&&<div style={{marginTop:10,background:'#fff',borderRadius:12,padding:'11px 14px',border:'1px solid var(--g2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:11,color:'var(--g4)',fontWeight:600}}>セッション開始</div><div style={{fontSize:13,fontWeight:700,color:'var(--dark)',fontFamily:'Inter,sans-serif'}}>{startTime} 〜 経過 {fmtHMS(total)}</div></div>
        </div>}
      </div>

      {/* 使い方 */}
      {mode==='idle'&&(
        <div style={{background:'var(--white)',marginTop:8,padding:'14px 20px'}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>タイマーの使い方</div>
          {[['1','稼働を開始する','アプリをオンにしたらタップ'],['2','配達開始','注文が入ったらタップ'],['3','待機へ','注文待ちに戻ったらタップ'],['4','休憩','完全停止（時間はカウントされない）'],['5','終了・記録','稼働を終えたらタップして収益を入力']].map(([n,t,d])=>(
            <div key={n} style={{display:'flex',gap:10,marginBottom:8,alignItems:'flex-start'}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'#FFF0F1',color:'var(--red)',fontSize:11,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #FFD0D4'}}>{n}</div>
              <div><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:11,color:'var(--g4)',marginTop:1}}>{d}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* 記録フォーム */}
      {showForm&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="sheet">
            <div style={{padding:'12px 20px 0',borderBottom:'1px solid var(--g2)'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><div style={{width:40,height:4,borderRadius:2,background:'var(--g2)'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:12}}>
                <span style={{fontSize:17,fontWeight:700}}>稼働を記録する</span>
                <button onClick={()=>setShowForm(false)} style={{fontSize:22,color:'var(--g4)',lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{padding:'16px 20px 48px',display:'flex',flexDirection:'column',gap:13}}>
              {/* 時間サマリー */}
              <div style={{background:'#18181B',borderRadius:14,padding:'13px 16px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',textAlign:'center'}}>
                {[['稼働合計',fmtHMS(total),'#4ADE80'],['配達のみ',fmtHMS(workSec),'rgba(255,255,255,0.6)'],['待機のみ',fmtHMS(waitSec),'#FBB324']].map(([l,v,c])=>(
                  <div key={l}><div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:700,fontFamily:'Inter,sans-serif',color:c}}>{v}</div></div>
                ))}
              </div>
              <div><label className="field-label">収益合計（円）※必須</label><input style={iS} type="number" inputMode="numeric" placeholder="8500" value={form.earnings} onChange={e=>setForm(f=>({...f,earnings:e.target.value}))}/></div>
              <div style={{background:'var(--g1)',borderRadius:12,padding:'12px',border:'1px solid var(--g2)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--g4)',marginBottom:8}}>内訳（任意）</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[['base_earnings','基本料金'],['boost','ブースト'],['quest','クエスト'],['tip','チップ']].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:10,color:'var(--g4)',marginBottom:3,fontWeight:600}}>{l}</div>
                      <input type="number" inputMode="numeric" placeholder="0" style={{...iS,padding:'8px 10px',fontSize:13}} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
                  ))}
                </div>
              </div>
              <div><label className="field-label">走行距離（km）</label><input style={iS} type="number" inputMode="numeric" placeholder="30" value={form.distance} onChange={e=>setForm(f=>({...f,distance:e.target.value}))}/></div>
              <div>
                <label className="field-label">使用アプリ ※必須</label>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {userApps.map(a=>{const sel=form.apps.includes(a.id);return(
                    <div key={a.id} onClick={()=>togApp(a.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px',borderRadius:14,cursor:'pointer',border:`1.5px solid ${sel?a.color:'var(--g2)'}`,background:sel?a.color+'12':'#FAFAFA'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:18}}>{a.logo}</span><span style={{fontSize:14,fontWeight:600,color:sel?a.color:'var(--g5)'}}>{a.name}</span></div>
                      <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${sel?a.color:'var(--g2)'}`,background:sel?a.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>{sel&&<span style={{fontSize:11,color:'#fff',fontWeight:700}}>✓</span>}</div>
                    </div>
                  )})}
                </div>
              </div>
              <div>
                <label className="field-label">時間帯</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                  {SLOTS.map(s=>{const sel=form.time_slot===s.key;return(
                    <button key={s.key} onClick={()=>setForm(f=>({...f,time_slot:f.time_slot===s.key?'':s.key}))}
                      style={{padding:'10px 8px',borderRadius:14,border:`1.5px solid ${sel?'var(--red)':'var(--g2)'}`,background:sel?'#FFF0F1':'#FAFAFA',cursor:'pointer',textAlign:'left'}}>
                      <div style={{fontSize:12,fontWeight:600,color:sel?'var(--red)':'var(--g5)'}}>{s.label}</div>
                      <div style={{fontSize:10,color:'var(--g4)'}}>{s.sub}</div>
                    </button>
                  )})}
                </div>
              </div>
              <div>
                <label className="field-label">天気</label>
                <div style={{display:'flex',gap:7}}>
                  {WEATHERS.map(w=>{const sel=form.weather===w.key;return(
                    <button key={w.key} onClick={()=>setForm(f=>({...f,weather:f.weather===w.key?'':w.key}))}
                      style={{flex:1,padding:'9px 3px',borderRadius:12,border:`1.5px solid ${sel?'var(--red)':'var(--g2)'}`,background:sel?'#FFF0F1':'#FAFAFA',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                      <span style={{fontSize:17}}>{w.icon}</span>
                      <span style={{fontSize:10,fontWeight:600,color:sel?'var(--red)':'var(--g4)'}}>{w.label}</span>
                    </button>
                  )})}
                </div>
              </div>
              <div><label className="field-label">メモ（任意）</label><input style={{...iS,fontSize:14,fontWeight:500}} type="text" placeholder="雨の日、イベントあり…" value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))}/></div>
              {prvRate&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--g1)',borderRadius:12,padding:'11px 14px',border:'1px solid var(--g2)'}}>
                <span style={{fontSize:12,color:'var(--g4)'}}>時給プレビュー</span>
                <span style={{fontSize:19,fontWeight:900,color:rateColor(prvRate),fontFamily:'Inter,sans-serif'}}>¥{prvRate.toLocaleString()}/h</span>
              </div>}
              <button onClick={save} disabled={!form.earnings||!form.apps.length} className="btn-red">記録する</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}