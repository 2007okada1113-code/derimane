import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

const TYPES=[{key:'store',label:'店舗情報',color:'var(--blue)',bg:'var(--blueLt)'},{key:'area',label:'エリア情報',color:'var(--green)',bg:'var(--greenLt)'},{key:'caution',label:'注意情報',color:'var(--red)',bg:'#FFF0F1'}]

export default function Community() {
  const { user } = useAuth()
  const { show, Toast } = useToast()
  const [posts,   setPosts]   = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [tab,     setTab]     = useState('all')
  const [loading, setLoading] = useState(true)
  const [showForm,setShowForm]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({title:'',content:'',type:'store',target_name:''})

  const load = async () => {
    if(!user)return
    const [a,m] = await Promise.all([
      supabase.from('posts').select('*').eq('status','approved').order('created_at',{ascending:false}),
      supabase.from('posts').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    ])
    setPosts(a.data||[]);setMyPosts(m.data||[]);setLoading(false)
  }
  useEffect(()=>{load()},[user])

  const submit = async ()=>{
    if(!form.title||!form.content)return show('タイトルと本文を入力してください','warn')
    setSaving(true)
    try{
      await supabase.from('posts').insert({user_id:user.id,title:form.title,content:form.content,type:form.type,target_name:form.target_name,status:'pending'})
      show('投稿しました。審査後に公開されます。')
      setShowForm(false);setForm({title:'',content:'',type:'store',target_name:''});load()
    }catch{show('投稿に失敗しました','err')}
    finally{setSaving(false)}
  }

  const iS={width:'100%',border:'1.5px solid var(--g2)',borderRadius:14,padding:'12px 14px',fontSize:15,fontWeight:600,color:'var(--dark)',background:'#FAFAFA',outline:'none',boxSizing:'border-box'}
  const displayed=tab==='all'?posts:myPosts
  const statusStyle={pending:{label:'審査待ち',color:'var(--orange)',bg:'#FFFBEB'},approved:{label:'公開中',color:'var(--green)',bg:'var(--greenLt)'},rejected:{label:'非公開',color:'var(--red)',bg:'#FFF0F1'}}

  return (
    <div className="page fade-in">
      <Toast/>
      <div style={{background:'var(--white)',borderBottom:'1px solid var(--g2)',padding:'52px 20px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:52}}>
          <span style={{fontSize:18,fontWeight:900}}>情報共有</span>
          <button onClick={()=>setShowForm(true)}
            style={{background:'var(--red)',border:'none',borderRadius:20,padding:'7px 16px',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1V11M1 6H11" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            投稿
          </button>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid var(--g2)'}}>
          {[['all','公開中'],['mine','自分の投稿']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{flex:1,padding:'12px 0',background:'none',border:'none',borderBottom:`2.5px solid ${tab===k?'var(--red)':'transparent'}`,fontSize:14,fontWeight:700,color:tab===k?'var(--red)':'var(--g4)',cursor:'pointer'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 説明 */}
      <div style={{padding:'12px 20px',background:'var(--white)',borderBottom:'8px solid var(--g1)',fontSize:12,color:'var(--g4)',lineHeight:1.7}}>
        店舗・エリア・注意情報をシェア。投稿は審査後に公開されます。
      </div>

      {/* 投稿一覧 */}
      {loading?(
        <div style={{padding:'48px 20px',textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}/></div>
      ):displayed.length===0?(
        <div style={{padding:'48px 20px',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:10}}>💬</div>
          <div style={{fontSize:14,color:'var(--g4)'}}>{tab==='all'?'公開中の投稿がありません':'まだ投稿していません'}</div>
        </div>
      ):(
        <div style={{background:'var(--white)'}}>
          {displayed.map((post,i)=>{
            const pt=TYPES.find(t=>t.key===post.type)||TYPES[0]
            const st=tab==='mine'?statusStyle[post.status]:null
            return(
              <div key={post.id} style={{padding:'14px 20px',borderTop:i>0?'1px solid var(--g2)':'none'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:7}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:11,fontWeight:700,color:pt.color,background:pt.bg,padding:'2px 8px',borderRadius:5}}>{pt.label}</span>
                    {post.target_name&&<span style={{fontSize:11,color:'var(--g4)'}}>{post.target_name}</span>}
                  </div>
                  {st&&<span style={{fontSize:10,fontWeight:700,color:st.color,background:st.bg,padding:'2px 8px',borderRadius:5,flexShrink:0}}>{st.label}</span>}
                </div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{post.title}</div>
                <div style={{fontSize:13,color:'var(--g5)',lineHeight:1.7}}>{post.content}</div>
                <div style={{fontSize:11,color:'var(--g4)',marginTop:8,fontFamily:'Inter,sans-serif'}}>
                  {new Date(post.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 投稿フォーム */}
      {showForm&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="sheet">
            <div style={{padding:'12px 20px 0',borderBottom:'1px solid var(--g2)'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><div style={{width:40,height:4,borderRadius:2,background:'var(--g2)'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:12}}>
                <span style={{fontSize:17,fontWeight:700}}>情報を投稿する</span>
                <button onClick={()=>setShowForm(false)} style={{fontSize:22,color:'var(--g4)',lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{padding:'16px 20px 48px',display:'flex',flexDirection:'column',gap:13}}>
              <div style={{background:'#FFF0F1',borderRadius:12,padding:'10px 13px',border:'1px solid #FFD0D4',fontSize:12,color:'var(--red)',lineHeight:1.7}}>
                🚫 個人を特定できる情報・誹謗中傷・不正確な情報は投稿しないでください
              </div>
              <div>
                <label className="field-label">種類</label>
                <div style={{display:'flex',gap:7}}>
                  {TYPES.map(t=>(
                    <button key={t.key} onClick={()=>setForm(f=>({...f,type:t.key}))}
                      style={{flex:1,padding:'9px 4px',borderRadius:12,cursor:'pointer',border:`1.5px solid ${form.type===t.key?t.color:'var(--g2)'}`,background:form.type===t.key?t.bg:'#FAFAFA',color:form.type===t.key?t.color:'var(--g5)',fontSize:12,fontWeight:700}}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="field-label">店舗名・エリア名（任意）</label><input style={iS} type="text" placeholder="例：○○マクドナルド渋谷店" value={form.target_name} onChange={e=>setForm(f=>({...f,target_name:e.target.value}))}/></div>
              <div><label className="field-label">タイトル</label><input style={iS} type="text" placeholder="例：○○店は待機時間が長め" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
              <div><label className="field-label">本文</label><textarea style={{...iS,resize:'none',lineHeight:1.7}} rows={4} placeholder="詳しい情報をここに書いてください" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}/></div>
              <div style={{background:'var(--g1)',borderRadius:12,padding:'10px 13px',fontSize:12,color:'var(--g4)'}}>✅ 投稿は審査後に公開されます。匿名で表示されます。</div>
              <button onClick={submit} disabled={!form.title||!form.content||saving} className="btn-red">{saving?'投稿中…':'投稿する（審査あり）'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}