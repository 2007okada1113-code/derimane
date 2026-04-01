import { useState, useMemo } from 'react'
import { useAppData } from '../App'
import { useToast } from '../hooks/useToast'
import { IC } from '../components/Icons'
import { yen, calcRate, toYM, ymLabel, rateColor, todayStr } from '../utils/helpers'

const APPS=[{id:'ubereats',name:'Uber Eats',color:'#06C167',logo:'🟢',bg:'#E8FFF2'},{id:'demaekan',name:'出前館',color:'#FF3B30',logo:'🔴',bg:'#FFF0F0'},{id:'wolt',name:'Wolt',color:'#009DE0',logo:'🔵',bg:'#E8F5FF'},{id:'menu',name:'menu',color:'#FF6900',logo:'🟠',bg:'#FFF5E8'},{id:'rocket',name:'ロケットなう',color:'#5B4EFF',logo:'🚀',bg:'#F0EEFF'},{id:'hakobin',name:'はこびん',color:'#00B288',logo:'🟩',bg:'#E8FFF8'}]
const ECATS=['ガソリン','消耗品','修理','車検・保険','食費','その他']
const SLOTS=[{key:'morning',label:'朝'},{key:'lunch',label:'昼'},{key:'evening',label:'夕'},{key:'night',label:'夜'}]
const WEATHERS=[{key:'sunny',label:'晴れ',icon:'☀️'},{key:'cloudy',label:'曇り',icon:'☁️'},{key:'rain',label:'雨',icon:'🌧️'},{key:'snow',label:'雪',icon:'❄️'}]
const DAYS=['日','月','火','水','木','金','土']

export default function Records() {
  const { records,expenses,settings,addRecord,updateRecord,deleteRecord,addExpense,deleteExpense } = useAppData()
  const { show, Toast } = useToast()
  const [tab,      setTab]      = useState('records')
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [delTarget,setDelTarget]= useState(null)
  const userApps = APPS.filter(a=>(settings.active_apps||['ubereats']).includes(a.id))
  const months   = useMemo(()=>[...new Set(records.map(r=>toYM(r.date)))].sort((a,b)=>b.localeCompare(a)),[records])
  const [selM, setSelM] = useState(()=>{const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`})
  const actM   = months.includes(selM)?selM:(months[0]??selM)
  const mRecs  = useMemo(()=>records.filter(r=>toYM(r.date)===actM).sort((a,b)=>b.date.localeCompare(a.date)),[records,actM])
  const mExps  = useMemo(()=>expenses.filter(e=>toYM(e.date)===actM),[expenses,actM])
  const mEarn  = mRecs.reduce((s,r)=>s+r.earnings,0)
  const mHrs   = mRecs.reduce((s,r)=>s+r.hours,0)
  const mNet   = mEarn-mExps.reduce((s,e)=>s+e.amount,0)

  const emptyR={date:todayStr(),earnings:'',base_earnings:'',boost:'',quest:'',tip:'',hours:'',wait_hours:'',distance:'',apps:[],memo:'',time_slot:'',weather:''}
  const emptyE={date:todayStr(),amount:'',category:'ガソリン',memo:'',km:''}
  const [rf,setRf]=useState(emptyR)
  const [ef,setEf]=useState(emptyE)
  const iS={width:'100%',border:'1.5px solid var(--g2)',borderRadius:14,padding:'12px 14px',fontSize:15,fontWeight:600,color:'var(--dark)',background:'#FAFAFA',outline:'none',boxSizing:'border-box'}

  const openAdd=()=>{setRf(emptyR);setEditId(null);setShowForm('record')}
  const openEdit=r=>{setRf({date:r.date,earnings:String(r.earnings),base_earnings:String(r.base_earnings||''),boost:String(r.boost||''),quest:String(r.quest||''),tip:String(r.tip||''),hours:String(r.hours),wait_hours:String(r.wait_hours||''),distance:String(r.distance||''),apps:r.apps||[],memo:r.memo||'',time_slot:r.time_slot||'',weather:r.weather||''});setEditId(r.id);setShowForm('record')}
  const togApp=id=>setRf(f=>({...f,apps:f.apps.includes(id)?f.apps.filter(x=>x!==id):[...f.apps,id]}))

  const saveR=()=>{
    if(!rf.earnings)return show('収益を入力してください','warn')
    if(!rf.hours)return show('稼働時間を入力してください','warn')
    if(!rf.apps.length)return show('アプリを選択してください','warn')
    const p={date:rf.date,earnings:Number(rf.earnings),base_earnings:rf.base_earnings?Number(rf.base_earnings):Number(rf.earnings),boost:Number(rf.boost||0),quest:Number(rf.quest||0),tip:Number(rf.tip||0),hours:Number(rf.hours),wait_hours:Number(rf.wait_hours||0),distance:Number(rf.distance||0),apps:rf.apps,memo:rf.memo,time_slot:rf.time_slot,weather:rf.weather}
    if(editId){updateRecord(editId,p);show('更新しました ✓')}else{addRecord(p);setSelM(toYM(rf.date));show('記録しました ✓')}
    setShowForm(false)
  }
  const saveE=()=>{
    if(!ef.amount)return show('金額を入力してください','warn')
    addExpense({date:ef.date,amount:Number(ef.amount),category:ef.category,memo:ef.memo,km:ef.km?Number(ef.km):null})
    show('経費を記録しました ✓');setShowForm(false)
  }
  const doDel=()=>{
    if(!delTarget)return
    if(delTarget.type==='record'){deleteRecord(delTarget.id);show('削除しました','warn')}
    else{deleteExpense(delTarget.id);show('削除しました','warn')}
    setDelTarget(null)
  }
  const prvRate=rf.earnings&&rf.hours?calcRate(Number(rf.earnings),Number(rf.hours)):null

  return (
    <div className="page fade-in">
      <Toast/>
      {/* ヘッダー */}
      <div style={{background:'var(--white)',borderBottom:'1px solid var(--g2)',padding:'52px 20px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:52}}>
          <span style={{fontSize:18,fontWeight:900}}>収益記録</span>
          <button onClick={tab==='records'?openAdd:()=>{setEf(emptyE);setShowForm('expense')}}
            style={{background:'var(--red)',border:'none',borderRadius:20,padding:'7px 16px',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1V11M1 6H11" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            追加
          </button>
        </div>
        {/* タブ */}
        <div style={{display:'flex',borderBottom:'1px solid var(--g2)',marginTop:4}}>
          {[['records','収益'],['expenses','経費']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{flex:1,padding:'12px 0',background:'none',border:'none',borderBottom:`2.5px solid ${tab===k?'var(--red)':'transparent'}`,fontSize:14,fontWeight:700,color:tab===k?'var(--red)':'var(--g4)',cursor:'pointer'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 月セレクター */}
      <div className="month-scroll">
        {months.map(ym=>(
          <button key={ym} onClick={()=>setSelM(ym)} className={`mchip ${actM===ym?'on':'off'}`}>{ymLabel(ym)}</button>
        ))}
        {months.length===0&&<div style={{fontSize:13,color:'var(--g4)',padding:'4px 0'}}>記録がありません</div>}
      </div>

      {/* サマリー */}
      {tab==='records'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'0 20px 12px',background:'var(--white)',borderBottom:'8px solid var(--g1)'}}>
          <div style={{background:'#FFF0F1',borderRadius:12,padding:'12px 14px',border:'1px solid #FFD0D4'}}>
            <div style={{fontSize:11,color:'var(--g4)',marginBottom:4}}>今月の収益</div>
            <div style={{fontSize:18,fontWeight:900,color:'var(--red)',fontFamily:'Inter,sans-serif'}}>¥{mEarn.toLocaleString()}</div>
          </div>
          <div style={{background:'var(--g1)',borderRadius:12,padding:'12px 14px',border:'1px solid var(--g2)'}}>
            <div style={{fontSize:11,color:'var(--g4)',marginBottom:4}}>平均時給</div>
            <div style={{fontSize:18,fontWeight:900,fontFamily:'Inter,sans-serif'}}>¥{calcRate(mEarn,mHrs).toLocaleString()}</div>
          </div>
          <div style={{background:'var(--g1)',borderRadius:12,padding:'12px 14px',border:'1px solid var(--g2)'}}>
            <div style={{fontSize:11,color:'var(--g4)',marginBottom:4}}>稼働日数</div>
            <div style={{fontSize:18,fontWeight:900,fontFamily:'Inter,sans-serif'}}>{new Set(mRecs.map(r=>r.date)).size}日</div>
          </div>
          <div style={{background:'var(--g1)',borderRadius:12,padding:'12px 14px',border:'1px solid var(--g2)'}}>
            <div style={{fontSize:11,color:'var(--g4)',marginBottom:4}}>純利益</div>
            <div style={{fontSize:18,fontWeight:900,fontFamily:'Inter,sans-serif',color:mNet>=0?'var(--green)':'var(--red)'}}>¥{Math.abs(mNet).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* 収益一覧 */}
      {tab==='records'&&(
        <div style={{background:'var(--white)'}}>
          {mRecs.length===0?(
            <div style={{padding:'48px 20px',textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:10}}>📋</div>
              <div style={{fontSize:14,color:'var(--g4)'}}>{ymLabel(actM)}の記録がありません</div>
            </div>
          ):mRecs.map((r,i)=>{
            const rv=calcRate(r.earnings,r.hours)
            const apps=(r.apps||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean)
            const d=new Date(r.date),dow=DAYS[d.getDay()],isSun=d.getDay()===0||d.getDay()===6
            return(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none'}}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                  background:isSun?'#FFF0F1':'var(--g1)',border:`1px solid ${isSun?'#FFD0D4':'var(--g2)'}`,
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:19,fontWeight:900,lineHeight:1,color:isSun?'var(--red)':'var(--dark)',fontFamily:'Inter,sans-serif'}}>{d.getDate()}</span>
                  <span style={{fontSize:9,fontWeight:700,color:isSun?'var(--red)':'var(--g4)',marginTop:1}}>{dow}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:4,marginBottom:3,flexWrap:'wrap'}}>
                    {apps.map(a=>(
                      <span key={a.id} style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:5,background:a.bg,color:a.color,display:'inline-flex',alignItems:'center',gap:3}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:a.color,display:'inline-block'}}/>
                        {a.name}
                      </span>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:'var(--g4)'}}>
                    {r.time_slot&&SLOTS.find(s=>s.key===r.time_slot)?.label+' · '}
                    {r.hours}h稼働
                    {r.distance>0&&` · ${r.distance}km`}
                  </div>
                </div>
                <div style={{textAlign:'right',marginRight:6}}>
                  <div style={{fontSize:17,fontWeight:900,fontFamily:'Inter,sans-serif'}}>¥{r.earnings.toLocaleString()}</div>
                  <div style={{fontSize:11,fontWeight:700,marginTop:2,color:rateColor(rv),fontFamily:'Inter,sans-serif'}}>¥{rv.toLocaleString()}/h</div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>openEdit(r)} style={{width:28,height:28,borderRadius:8,border:'1px solid var(--g2)',background:'var(--g1)',color:'var(--g4)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✏️</button>
                  <button onClick={()=>setDelTarget({id:r.id,type:'record'})} style={{width:28,height:28,borderRadius:8,border:'1px solid var(--g2)',background:'var(--g1)',color:'var(--g4)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 経費一覧 */}
      {tab==='expenses'&&(
        <div style={{background:'var(--white)'}}>
          {mExps.length===0?(
            <div style={{padding:'48px 20px',textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:10}}>💰</div>
              <div style={{fontSize:14,color:'var(--g4)'}}>経費がありません</div>
            </div>
          ):mExps.map((e,i)=>(
            <div key={e.id} style={{display:'flex',alignItems:'center',padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2}}>
                  <span style={{fontSize:11,color:'var(--g4)',fontFamily:'Inter,sans-serif'}}>{e.date}</span>
                  <span style={{fontSize:11,fontWeight:600,background:'var(--g1)',padding:'2px 8px',borderRadius:5,border:'1px solid var(--g2)',color:'var(--g5)'}}>{e.category}</span>
                </div>
                {e.memo&&<div style={{fontSize:11,color:'var(--g4)'}}>{e.memo}</div>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:17,fontWeight:900,color:'var(--red)',fontFamily:'Inter,sans-serif'}}>−¥{e.amount.toLocaleString()}</span>
                <button onClick={()=>setDelTarget({id:e.id,type:'expense'})} style={{width:28,height:28,borderRadius:8,border:'1px solid var(--g2)',background:'var(--g1)',color:'var(--g4)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 収益フォーム */}
      {showForm==='record'&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="sheet">
            <div style={{padding:'12px 20px 0',borderBottom:'1px solid var(--g2)'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><div style={{width:40,height:4,borderRadius:2,background:'var(--g2)'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:12}}>
                <span style={{fontSize:17,fontWeight:700}}>{editId?'記録を編集':'収益を記録'}</span>
                <button onClick={()=>setShowForm(false)} style={{fontSize:22,color:'var(--g4)',lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{padding:'16px 20px 48px',display:'flex',flexDirection:'column',gap:13}}>
              <div><label className="field-label">日付</label><input style={iS} type="date" value={rf.date} onChange={e=>setRf(f=>({...f,date:e.target.value}))}/></div>
              <div><label className="field-label">収益合計（円）</label><input style={iS} type="number" inputMode="numeric" placeholder="8500" value={rf.earnings} onChange={e=>setRf(f=>({...f,earnings:e.target.value}))}/></div>
              <div style={{background:'var(--g1)',borderRadius:12,padding:'12px',border:'1px solid var(--g2)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--g4)',marginBottom:8}}>内訳（任意）</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[['base_earnings','基本料金'],['boost','ブースト'],['quest','クエスト'],['tip','チップ']].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:10,color:'var(--g4)',marginBottom:3,fontWeight:600}}>{l}</div>
                      <input type="number" inputMode="numeric" placeholder="0" style={{...iS,padding:'8px 10px',fontSize:13}} value={rf[k]||''} onChange={e=>setRf(f=>({...f,[k]:e.target.value}))}/></div>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div><label className="field-label">稼働時間（h）</label><input style={iS} type="number" inputMode="decimal" step="0.5" placeholder="5" value={rf.hours} onChange={e=>setRf(f=>({...f,hours:e.target.value}))}/></div>
                <div><label className="field-label">走行距離（km）</label><input style={iS} type="number" inputMode="numeric" placeholder="30" value={rf.distance} onChange={e=>setRf(f=>({...f,distance:e.target.value}))}/></div>
              </div>
              <div>
                <label className="field-label">使用アプリ</label>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {userApps.map(a=>{const sel=rf.apps.includes(a.id);return(
                    <div key={a.id} onClick={()=>togApp(a.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 13px',borderRadius:14,cursor:'pointer',border:`1.5px solid ${sel?a.color:'var(--g2)'}`,background:sel?a.bg:'#FAFAFA'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:18}}>{a.logo}</span><span style={{fontSize:14,fontWeight:600,color:sel?a.color:'var(--g5)'}}>{a.name}</span></div>
                      <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${sel?a.color:'var(--g2)'}`,background:sel?a.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>{sel&&<span style={{fontSize:11,color:'#fff',fontWeight:700}}>✓</span>}</div>
                    </div>
                  )})}
                </div>
              </div>
              <div><label className="field-label">メモ</label><input style={{...iS,fontSize:14,fontWeight:500}} type="text" placeholder="メモ（任意）" value={rf.memo} onChange={e=>setRf(f=>({...f,memo:e.target.value}))}/></div>
              {prvRate&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--g1)',borderRadius:12,padding:'11px 14px',border:'1px solid var(--g2)'}}>
                <span style={{fontSize:12,color:'var(--g4)'}}>時給プレビュー</span>
                <span style={{fontSize:19,fontWeight:900,color:rateColor(prvRate),fontFamily:'Inter,sans-serif'}}>¥{prvRate.toLocaleString()}/h</span>
              </div>}
              <button onClick={saveR} disabled={!rf.earnings||!rf.hours||!rf.apps.length} className="btn-red">{editId?'更新する':'保存する'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 経費フォーム */}
      {showForm==='expense'&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="sheet">
            <div style={{padding:'12px 20px 0',borderBottom:'1px solid var(--g2)'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><div style={{width:40,height:4,borderRadius:2,background:'var(--g2)'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:12}}>
                <span style={{fontSize:17,fontWeight:700}}>経費を記録</span>
                <button onClick={()=>setShowForm(false)} style={{fontSize:22,color:'var(--g4)',lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{padding:'16px 20px 48px',display:'flex',flexDirection:'column',gap:13}}>
              <div><label className="field-label">日付</label><input style={iS} type="date" value={ef.date} onChange={e=>setEf(f=>({...f,date:e.target.value}))}/></div>
              <div><label className="field-label">金額（円）</label><input style={iS} type="number" inputMode="numeric" placeholder="3000" value={ef.amount} onChange={e=>setEf(f=>({...f,amount:e.target.value}))}/></div>
              <div>
                <label className="field-label">カテゴリ</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {ECATS.map(cat=>{const sel=ef.category===cat;return(
                    <button key={cat} onClick={()=>setEf(f=>({...f,category:cat}))} style={{padding:'8px 14px',borderRadius:20,border:`1.5px solid ${sel?'var(--red)':'var(--g2)'}`,background:sel?'var(--red)':'#FAFAFA',color:sel?'#fff':'var(--g5)',fontSize:13,fontWeight:600,cursor:'pointer'}}>{cat}</button>
                  )})}
                </div>
              </div>
              <div><label className="field-label">メモ（任意）</label><input style={{...iS,fontSize:14,fontWeight:500}} type="text" placeholder="詳細メモ" value={ef.memo} onChange={e=>setEf(f=>({...f,memo:e.target.value}))}/></div>
              <button onClick={saveE} disabled={!ef.amount||!ef.category} className="btn-red">保存する</button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {delTarget&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setDelTarget(null)}>
          <div style={{background:'var(--white)',borderRadius:20,padding:'24px 20px',width:'88%',maxWidth:320,margin:'auto',textAlign:'center'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>削除しますか？</div>
            <div style={{fontSize:13,color:'var(--g4)',marginBottom:20}}>この操作は元に戻せません</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setDelTarget(null)} style={{flex:1,padding:'13px',background:'var(--g1)',border:'none',borderRadius:14,fontSize:14,fontWeight:600,cursor:'pointer'}}>キャンセル</button>
              <button onClick={doDel} style={{flex:1,padding:'13px',background:'var(--red)',border:'none',borderRadius:14,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}