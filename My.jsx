import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../App'
import { IC } from '../components/Icons'

const APPS=[
  {id:'ubereats',name:'Uber Eats',color:'#06C167',logo:'🟢'},
  {id:'demaekan',name:'出前館',color:'#FF3B30',logo:'🔴'},
  {id:'wolt',name:'Wolt',color:'#009DE0',logo:'🔵'},
  {id:'menu',name:'menu',color:'#FF6900',logo:'🟠'},
  {id:'rocket',name:'ロケットなう',color:'#5B4EFF',logo:'🚀'},
  {id:'hakobin',name:'はこびん',color:'#00B288',logo:'🟩'},
]

export default function My() {
  const { user, signOut } = useAuth()
  const { settings, updateSettings, exportBackup, records, expenses } = useAppData()
  const navigate = useNavigate()

  const togApp = id => {
    const apps = settings.active_apps||[]
    updateSettings({ active_apps: apps.includes(id)?apps.filter(x=>x!==id):[...apps,id] })
  }

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const iS = {
    width:'100%', border:'1.5px solid var(--g2)', borderRadius:14,
    padding:'13px 14px', fontSize:16, fontWeight:600, color:'var(--dark)',
    background:'#FAFAFA', outline:'none', boxSizing:'border-box',
  }

  return (
    <div className="page fade-in">
      {/* ヘッダー */}
      <div style={{ background:'var(--white)', borderBottom:'1px solid var(--g2)',
        padding:'52px 20px 16px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--red)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, fontWeight:900, color:'#fff' }}>
          {(settings.name||'R')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:900 }}>{settings.name||'ライダー'}</div>
          <div style={{ fontSize:12, color:'var(--g4)', marginTop:2 }}>{user?.email}</div>
        </div>
      </div>

      {/* 基本設定 */}
      <div style={{ background:'var(--white)', marginTop:8, padding:'16px 20px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--g4)', marginBottom:14, letterSpacing:.5 }}>基本設定</div>
        <div style={{ marginBottom:12 }}>
          <label className="field-label">名前</label>
          <input style={iS} type="text" value={settings.name||''} onChange={e=>updateSettings({name:e.target.value})}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label className="field-label">月間目標（円）</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16,fontWeight:700,color:'var(--g4)' }}>¥</span>
            <input style={{...iS,paddingLeft:28}} type="number" value={settings.goal||100000} onChange={e=>updateSettings({goal:Number(e.target.value)})}/>
          </div>
        </div>
        <div>
          <label className="field-label">使用アプリ</label>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {APPS.map(a=>{const sel=(settings.active_apps||[]).includes(a.id);return(
              <div key={a.id} onClick={()=>togApp(a.id)}
                style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'11px 13px',borderRadius:14,cursor:'pointer',
                  border:`1.5px solid ${sel?a.color:'var(--g2)'}`,
                  background:sel?a.color+'12':'#FAFAFA' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:18 }}>{a.logo}</span>
                  <span style={{ fontSize:14,fontWeight:600,color:sel?a.color:'var(--g5)' }}>{a.name}</span>
                </div>
                <div style={{ width:20,height:20,borderRadius:6,
                  border:`2px solid ${sel?a.color:'var(--g2)'}`,
                  background:sel?a.color:'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center' }}>
                  {sel&&<span style={{ fontSize:11,color:'#fff',fontWeight:700 }}>✓</span>}
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* データ管理 */}
      <div style={{ background:'var(--white)', marginTop:8 }}>
        <div style={{ padding:'14px 20px 4px', fontSize:12, fontWeight:700, color:'var(--g4)', letterSpacing:.5 }}>データ管理</div>
        {[
          {label:'バックアップをダウンロード', sub:`記録${records.length}件・経費${expenses.length}件`, action:exportBackup, color:'var(--dark)'},
        ].map(item=>(
          <div key={item.label} onClick={item.action}
            style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'14px 20px',borderTop:'1px solid var(--g2)',cursor:'pointer' }}>
            <div>
              <div style={{ fontSize:14,fontWeight:600,color:item.color }}>{item.label}</div>
              <div style={{ fontSize:11,color:'var(--g4)',marginTop:1 }}>{item.sub}</div>
            </div>
            {IC.chevron}
          </div>
        ))}
      </div>

      {/* ログアウト */}
      <div style={{ padding:'20px', marginTop:8 }}>
        <button onClick={handleSignOut}
          style={{ width:'100%', padding:'14px', background:'#FFF0F1',
            border:'1.5px solid #FFD0D4', borderRadius:14,
            fontSize:15, fontWeight:700, color:'var(--red)', cursor:'pointer' }}>
          ログアウト
        </button>
      </div>
    </div>
  )
}