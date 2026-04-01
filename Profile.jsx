import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

const APPS = [
  { id:'ubereats',  name:'Uber Eats',    color:'#06C167', logo:'🟢' },
  { id:'demaekan',  name:'出前館',       color:'#FF3B30', logo:'🔴' },
  { id:'wolt',      name:'Wolt',         color:'#009DE0', logo:'🔵' },
  { id:'menu',      name:'menu',         color:'#FF6900', logo:'🟠' },
  { id:'rocket',    name:'ロケットなう',  color:'#5B4EFF', logo:'🚀' },
  { id:'hakobin',   name:'はこびん',     color:'#00B288', logo:'🟩' },
]

export default function Profile() {
  const { user, profile, updateProfile } = useAuth()
  const { show, Toast } = useToast()

  const [tab, setTab] = useState('profile') // profile | security

  // プロフィール
  const [name,   setName]   = useState(profile?.name || '')
  const [goal,   setGoal]   = useState(String(profile?.goal || 100000))
  const [empType,setEmpType]= useState(profile?.employment_type || 'freelance')
  const [apps,   setApps]   = useState(profile?.active_apps || ['ubereats'])
  const [saving, setSaving] = useState(false)

  // パスワード変更
  const [curPass,  setCurPass]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confPass, setConfPass] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // メール変更
  const [newEmail,  setNewEmail]  = useState('')
  const [emailSaving,setEmailSaving] = useState(false)

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name,
        goal: Number(goal) || 100000,
        employment_type: empType,
        active_apps: apps,
      })
      show('プロフィールを保存しました ✓')
    } catch {
      show('保存に失敗しました', 'err')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!newPass || !confPass) return show('新しいパスワードを入力してください', 'warn')
    if (newPass !== confPass) return show('パスワードが一致しません', 'warn')
    if (newPass.length < 6) return show('パスワードは6文字以上にしてください', 'warn')
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) throw error
      show('パスワードを変更しました ✓')
      setCurPass(''); setNewPass(''); setConfPass('')
    } catch (e) {
      show(e.message || 'パスワード変更に失敗しました', 'err')
    } finally {
      setPwSaving(false)
    }
  }

  const changeEmail = async () => {
    if (!newEmail) return show('新しいメールアドレスを入力してください', 'warn')
    setEmailSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      show('確認メールを送りました。新しいアドレスを確認してください。')
      setNewEmail('')
    } catch (e) {
      show(e.message || 'メールアドレス変更に失敗しました', 'err')
    } finally {
      setEmailSaving(false)
    }
  }

  const togApp = (id) =>
    setApps(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id])

  const iS = {
    width:'100%', border:'1.5px solid var(--sep)', borderRadius:'var(--rLg)',
    padding:'13px 14px', fontSize:16, fontWeight:600, color:'var(--text)',
    background:'#FAFAFA', outline:'none', boxSizing:'border-box', fontFamily:'var(--font)',
  }

  return (
    <div className="page fade-in">
      <Toast />
      <div className="sec-title">アカウント設定</div>

      {/* タブ */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['profile','プロフィール'],['security','セキュリティ']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flex:1, padding:'10px', borderRadius:'var(--rLg)', border:'none',
              background: tab===k ? 'var(--brand)' : 'var(--card)',
              color: tab===k ? '#fff' : 'var(--text2)',
              fontWeight:600, fontSize:14, cursor:'pointer', boxShadow:'var(--shadow)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* プロフィール */}
      {tab === 'profile' && (
        <>
          {/* アバター */}
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--brand)',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 10px', fontSize:30, fontWeight:700, color:'#fff' }}>
              {(profile?.name || 'R')[0].toUpperCase()}
            </div>
            <div style={{ fontSize:13, color:'var(--text3)' }}>{user?.email}</div>
          </div>

          <div className="card" style={{ padding:'16px', marginBottom:12 }}>
            <div style={{ marginBottom:14 }}>
              <label className="field-label">名前・ニックネーム</label>
              <input style={iS} type="text" placeholder="ニックネーム"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="field-label">月間目標収益（円）</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                  fontSize:16, fontWeight:700, color:'var(--text3)' }}>¥</span>
                <input style={{ ...iS, paddingLeft:28 }} type="number"
                  placeholder="100000" value={goal}
                  onChange={e => setGoal(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="field-label">働き方</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['freelance','本業・個人事業主'],['employee','副業・会社員']].map(([val,label]) => (
                  <button key={val} onClick={() => setEmpType(val)}
                    style={{ flex:1, padding:'10px 6px', borderRadius:'var(--r)', cursor:'pointer',
                      border:`1.5px solid ${empType===val?'var(--brand)':'var(--sep)'}`,
                      background: empType===val ? 'var(--brandLt)' : '#FAFAFA',
                      color: empType===val ? 'var(--brand)' : 'var(--text2)',
                      fontSize:12, fontWeight:600 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">使用アプリ</label>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {APPS.map(a => {
                  const sel = apps.includes(a.id)
                  return (
                    <div key={a.id} onClick={() => togApp(a.id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'11px 13px', borderRadius:'var(--rLg)', cursor:'pointer',
                        border:`1.5px solid ${sel ? a.color : 'var(--sep)'}`,
                        background: sel ? a.color+'12' : '#FAFAFA', transition:'all .12s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>{a.logo}</span>
                        <span style={{ fontSize:14, fontWeight:600, color:sel?a.color:'var(--text2)' }}>{a.name}</span>
                      </div>
                      <div style={{ width:21, height:21, borderRadius:6, flexShrink:0,
                        border:`2px solid ${sel?a.color:'var(--sep)'}`,
                        background: sel ? a.color : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {sel && <span style={{ fontSize:11, color:'#fff', fontWeight:700 }}>✓</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} className="btn-brand">
            {saving ? '保存中…' : 'プロフィールを保存する'}
          </button>
        </>
      )}

      {/* セキュリティ */}
      {tab === 'security' && (
        <>
          {/* メールアドレス変更 */}
          <div className="sec-title" style={{ paddingTop:0 }}>メールアドレス変更</div>
          <div className="card" style={{ padding:'16px', marginBottom:16 }}>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10 }}>
              現在: <span style={{ fontWeight:600, color:'var(--text)' }}>{user?.email}</span>
            </div>
            <div style={{ marginBottom:12 }}>
              <label className="field-label">新しいメールアドレス</label>
              <input style={iS} type="email" placeholder="new@example.com"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12, lineHeight:1.7,
              background:'var(--card2)', borderRadius:'var(--r)', padding:'10px 12px' }}>
              💡 新しいアドレスに確認メールが届きます。<br/>
              リンクをクリックすると変更が完了します。
            </div>
            <button onClick={changeEmail} disabled={!newEmail || emailSaving} className="btn-brand">
              {emailSaving ? '送信中…' : '確認メールを送る'}
            </button>
          </div>

          {/* パスワード変更 */}
          <div className="sec-title">パスワード変更</div>
          <div className="card" style={{ padding:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label className="field-label">新しいパスワード（6文字以上）</label>
                <input style={iS} type="password" placeholder="新しいパスワード"
                  value={newPass} onChange={e => setNewPass(e.target.value)}
                  autoComplete="new-password" />
              </div>
              <div>
                <label className="field-label">新しいパスワード（確認）</label>
                <input style={iS} type="password" placeholder="もう一度入力"
                  value={confPass} onChange={e => setConfPass(e.target.value)}
                  autoComplete="new-password" />
              </div>
              {newPass && confPass && newPass !== confPass && (
                <div style={{ fontSize:12, color:'var(--red)', background:'var(--redLt)',
                  borderRadius:'var(--r)', padding:'9px 12px' }}>
                  ❌ パスワードが一致しません
                </div>
              )}
              <button onClick={changePassword}
                disabled={!newPass || !confPass || pwSaving}
                className="btn-brand">
                {pwSaving ? '変更中…' : 'パスワードを変更する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}