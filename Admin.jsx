import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

const TABS=[{key:'posts',label:'投稿管理'},{key:'users',label:'ユーザー'},{key:'notices',label:'お知らせ'},{key:'settings',label:'設定'}]

export default function Admin() {
  const { user } = useAuth()
  const { show, Toast } = useToast()
  const [tab,     setTab]     = useState('posts')
  const [posts,   setPosts]   = useState([])
  const [users,   setUsers]   = useState([])
  const [notices, setNotices] = useState([])
  const [settings,setSettings]= useState({})
  const [loading, setLoading] = useState(true)
  const [nForm,   setNForm]   = useState({title:'',content:''})
  const [saving,  setSaving]  = useState(false)

  useEffect(()=>{if(user)loadAll()},[user])

  const loadAll = async ()=>{
    setLoading(true)
    const [p,u,n,s]=await Promise.all([
      supabase.from('posts').select('*').order('created_at',{ascending:false}),
      supabase.from('profiles').select('*').order('created_at',{ascending:false}),
      supabase.from('announcements').select('*').order('created_at',{ascending:false}),
      supabase.from('app_settings').select('*'),
    ])
    setPosts(p.data||[]);setUsers(u.data||[]);setNotices(n.data||[])
    const sObj={};(s.data||[]).forEach(x=>{sObj[x.key]=x.value});setSettings(sObj)
    setLoading(false)
  }

  const updatePost = async (id,status)=>{
    await supabase.from('posts').update({status}).eq('id',id)
    setPosts(p=>p.map(x=>x.id===id?{...x,status}:x))
    show(status==='approved'?'承認しました ✓':'却下しました')
  }
  const deletePost = async id=>{
    await supabase.from('posts').delete().eq('id',id)
    setPosts(p=>p.filter(x=>x.id!==id));show('削除しました','warn')
  }
  const banUser = async (id,ban)=>{
    await supabase.from('profiles').update({is_banned:ban}).eq('id',id)
    setUsers(u=>u.map(x=>x.id===id?{...x,is_banned:ban}:x))
    show(ban?'BANしました':'BAN解除しました',ban?'warn':'ok')
  }
  const addNotice = async ()=>{
    if(!nForm.title||!nForm.content)return
    setSaving(true)
    const {data}=await supabase.from('announcements').insert({title:nForm.title,content:nForm.content,is_active:true}).select().single()
    setNotices(p=>[data,...p]);setNForm({title:'',content:''});setSaving(false);show('投稿しました ✓')
  }
  const toggleNotice = async (id,active)=>{
    await supabase.from('announcements').update({is_active:!active}).eq('id',id)
    setNotices(p=>p.map(x=>x.id===id?{...x,is_active:!active}:x))
  }
  const updateSetting = async (key,value)=>{
    await supabase.from('app_settings').upsert({key,value,updated_at:new Date().toISOString()})
    setSettings(s=>({...s,[key]:value}));show('設定を保存しました ✓')
  }

  const iS={width:'100%',border:'1.5px solid var(--g2)',borderRadius:14,padding:'12px 14px',fontSize:14,fontWeight:600,color:'var(--dark)',background:'#FAFAFA',outline:'none',boxSizing:'border-box'}
  const st={pending:{label:'審査待ち',color:'var(--orange)',bg:'#FFFBEB'},approved:{label:'公開中',color:'var(--green)',bg:'var(--greenLt)'},rejected:{label:'却下',color:'var(--red)',bg:'#FFF0F1'}}

  if(loading)return <div style={{padding:'80px 20px',textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}/></div>

  return (
    <div className="page fade-in">
      <Toast/>
      {/* ヘッダー */}
      <div style={{background:'var(--dark)',padding:'52px 20px 0'}}>
        <div style={{height:52,display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#7C3AED'}}/>
          <span style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:.5}}>管理者パネル</span>
        </div>
        <div style={{display:'flex',borderTop:'1px solid rgba(255,255,255,0.1)',overflowX:'auto',scrollbarWidth:'none'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{flexShrink:0,padding:'11px 16px',background:'none',border:'none',borderBottom:`2.5px solid ${tab===t.key?'#fff':'transparent'}`,fontSize:13,fontWeight:700,color:tab===t.key?'#fff':'rgba(255,255,255,0.45)',cursor:'pointer',whiteSpace:'nowrap'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 統計 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,padding:'14px 20px',background:'var(--white)',borderBottom:'8px solid var(--g1)'}}>
        {[['総ユーザー',users.length,'#7C3AED'],['審査待ち',posts.filter(p=>p.status==='pending').length,'var(--orange)'],['公開中投稿',posts.filter(p=>p.status==='approved').length,'var(--green)']].map(([l,n,c])=>(
          <div key={l} style={{background:'var(--g1)',borderRadius:12,padding:'11px',textAlign:'center',border:'1px solid var(--g2)'}}>
            <div style={{fontSize:24,fontWeight:900,color:c,fontFamily:'Inter,sans-serif'}}>{n}</div>
            <div style={{fontSize:10,color:'var(--g4)',fontWeight:600,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* 投稿管理 */}
      {tab==='posts'&&(
        <div style={{background:'var(--white)'}}>
          {posts.length===0?(
            <div style={{padding:'48px 20px',textAlign:'center',fontSize:14,color:'var(--g4)'}}>投稿がありません</div>
          ):posts.map((post,i)=>{
            const s=st[post.status]||{label:post.status,color:'var(--g4)',bg:'var(--g1)'}
            return(
              <div key={post.id} style={{padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none',borderLeft:`4px solid ${post.status==='pending'?'var(--orange)':post.status==='approved'?'var(--green)':'var(--g3)'}` }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                  <div style={{fontSize:14,fontWeight:700,flex:1,marginRight:8}}>{post.title}</div>
                  <span style={{fontSize:10,fontWeight:700,color:s.color,background:s.bg,padding:'2px 7px',borderRadius:5,flexShrink:0}}>{s.label}</span>
                </div>
                <div style={{fontSize:12,color:'var(--g4)',marginBottom:8,lineHeight:1.5}}>{post.content.slice(0,60)}{post.content.length>60?'…':''}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {post.status!=='approved'&&<button onClick={()=>updatePost(post.id,'approved')} style={{padding:'5px 12px',background:'var(--greenLt)',border:'1px solid #A7F3D0',borderRadius:8,color:'var(--green)',fontWeight:700,fontSize:11,cursor:'pointer'}}>承認</button>}
                  {post.status!=='rejected'&&<button onClick={()=>updatePost(post.id,'rejected')} style={{padding:'5px 12px',background:'#FFF0F1',border:'1px solid #FFD0D4',borderRadius:8,color:'var(--red)',fontWeight:700,fontSize:11,cursor:'pointer'}}>却下</button>}
                  <button onClick={()=>deletePost(post.id)} style={{padding:'5px 12px',background:'var(--g1)',border:'1px solid var(--g2)',borderRadius:8,color:'var(--g4)',fontWeight:600,fontSize:11,cursor:'pointer'}}>削除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ユーザー管理 */}
      {tab==='users'&&(
        <div style={{background:'var(--white)'}}>
          {users.map((u,i)=>(
            <div key={u.id} style={{padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none',opacity:u.is_banned?.5:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700}}>{u.name||'名無し'}</div>
                  <div style={{display:'flex',gap:5,marginTop:2}}>
                    {u.role==='admin'&&<span style={{fontSize:10,fontWeight:700,color:'#7C3AED',background:'#F5F3FF',padding:'1px 6px',borderRadius:4}}>管理者</span>}
                    {u.is_banned&&<span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'#FFF0F1',padding:'1px 6px',borderRadius:4}}>BAN中</span>}
                  </div>
                </div>
                {u.role!=='admin'&&(
                  <button onClick={()=>banUser(u.id,!u.is_banned)}
                    style={{padding:'6px 14px',background:u.is_banned?'var(--greenLt)':'#FFF0F1',border:`1px solid ${u.is_banned?'#A7F3D0':'#FFD0D4'}`,borderRadius:20,color:u.is_banned?'var(--green)':'var(--red)',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                    {u.is_banned?'BAN解除':'BAN'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* お知らせ */}
      {tab==='notices'&&(
        <>
          <div style={{background:'var(--white)',padding:'14px 20px',borderBottom:'8px solid var(--g1)'}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>お知らせを追加</div>
            <div style={{marginBottom:8}}><input style={iS} type="text" placeholder="タイトル" value={nForm.title} onChange={e=>setNForm(f=>({...f,title:e.target.value}))}/></div>
            <div style={{marginBottom:10}}><textarea style={{...iS,resize:'none',lineHeight:1.7}} rows={3} placeholder="本文" value={nForm.content} onChange={e=>setNForm(f=>({...f,content:e.target.value}))}/></div>
            <button onClick={addNotice} disabled={!nForm.title||!nForm.content||saving} className="btn-red">{saving?'投稿中…':'📢 投稿する'}</button>
          </div>
          <div style={{background:'var(--white)'}}>
            {notices.map((n,i)=>(
              <div key={n.id} style={{padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none',opacity:n.is_active?1:.5}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                  <div style={{fontSize:14,fontWeight:700,flex:1}}>{n.title}</div>
                  <span style={{fontSize:10,fontWeight:700,color:n.is_active?'var(--green)':'var(--g4)',background:n.is_active?'var(--greenLt)':'var(--g1)',padding:'2px 7px',borderRadius:5,flexShrink:0}}>{n.is_active?'表示中':'非表示'}</span>
                </div>
                <div style={{fontSize:12,color:'var(--g4)',marginBottom:8}}>{n.content.slice(0,50)}{n.content.length>50?'…':''}</div>
                <button onClick={()=>toggleNotice(n.id,n.is_active)}
                  style={{padding:'5px 12px',background:n.is_active?'#FFF0F1':'var(--greenLt)',border:`1px solid ${n.is_active?'#FFD0D4':'#A7F3D0'}`,borderRadius:8,color:n.is_active?'var(--red)':'var(--green)',fontWeight:700,fontSize:11,cursor:'pointer'}}>
                  {n.is_active?'非表示にする':'表示する'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* アプリ設定 */}
      {tab==='settings'&&(
        <div style={{background:'var(--white)'}}>
          {[{key:'maintenance_mode',label:'🔧 メンテナンスモード',desc:'ONにするとユーザーがアクセス不能になります'},{key:'post_enabled',label:'📝 投稿機能',desc:'OFFにすると新規投稿ができなくなります'}].map((s,i)=>(
            <div key={s.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderTop:i>0?'1px solid var(--g2)':'none'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{s.label}</div>
                <div style={{fontSize:11,color:'var(--g4)',marginTop:2}}>{s.desc}</div>
              </div>
              <div onClick={()=>updateSetting(s.key,settings[s.key]==='true'?'false':'true')}
                style={{width:48,height:28,borderRadius:14,cursor:'pointer',position:'relative',flexShrink:0,
                  background:settings[s.key]==='true'?(s.key==='maintenance_mode'?'var(--red)':'var(--green)'):'var(--g2)',
                  transition:'background .2s'}}>
                <div style={{position:'absolute',top:2,left:settings[s.key]==='true'?22:2,width:24,height:24,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}