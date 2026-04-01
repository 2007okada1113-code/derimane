import { useState, useEffect, useRef } from 'react'
import { useAppData } from '../App'
import { useToast } from '../hooks/useToast'

const rateColor = r => r>=2000?'var(--green)':r>=1500?'var(--blue)':r>=1000?'var(--orange)':'var(--red)'

export default function MapPage() {
  const { pins, addPin, deletePin } = useAppData()
  const { show, Toast } = useToast()
  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const markers = useRef([])
  const [ready,    setReady]    = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pending,  setPending]  = useState(null)
  const [form,     setForm]     = useState({label:'',avg_rate:'',type:'area',note:''})

  useEffect(()=>{
    if(!document.getElementById('lfc')){const l=document.createElement('link');l.id='lfc';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l)}
    const init=()=>{
      if(!mapRef.current||mapInst.current)return
      const L=window.L
      const m=L.map(mapRef.current,{zoomControl:false}).setView([35.6812,139.7671],12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM',maxZoom:19}).addTo(m)
      L.control.zoom({position:'bottomright'}).addTo(m)
      m.on('click',e=>{setPending({lat:e.latlng.lat,lng:e.latlng.lng});setForm({label:'',avg_rate:'',type:'area',note:''});setShowForm(true)})
      mapInst.current=m;setReady(true)
    }
    if(window.L){init();return}
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=init;document.body.appendChild(s)
    return()=>{if(mapInst.current){mapInst.current.remove();mapInst.current=null}}
  },[])

  useEffect(()=>{
    if(!ready||!window.L)return
    const L=window.L
    markers.current.forEach(m=>m.remove());markers.current=[]
    pins.forEach(pin=>{
      const col=pin.type==='trouble'?'#E8192C':rateColor(pin.avg_rate).replace('var(--green)','#00B248').replace('var(--blue)','#0057CC').replace('var(--orange)','#E06400').replace('var(--red)','#E8192C')
      const icon=L.divIcon({className:'',html:`<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${col};transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,iconSize:[32,32],iconAnchor:[16,32]})
      const mk=L.marker([pin.lat,pin.lng],{icon}).addTo(mapInst.current)
      mk.bindPopup(`<div style="font-family:Inter,sans-serif;min-width:120px"><b>${pin.label}</b>${pin.note?`<div style="font-size:11px;color:#8A8A8A;margin-top:2px">${pin.note}</div>`:''}<div style="font-size:15px;font-weight:700;margin:4px 0;color:${col}">${pin.type==='trouble'?'⚠️ 地雷スポット':`¥${pin.avg_rate.toLocaleString()}/h`}</div><button onclick="window.__dpn(${pin.id})" style="width:100%;padding:4px;background:#FFF0F1;border:none;border-radius:5px;color:#E8192C;font-weight:700;font-size:11px;cursor:pointer;margin-top:3px">削除</button></div>`)
      markers.current.push(mk)
    })
  },[pins,ready])

  useEffect(()=>{window.__dpn=id=>{deletePin(id);show('削除しました','warn')}})

  const handleAdd=()=>{
    if(!form.label)return
    addPin({lat:pending.lat,lng:pending.lng,label:form.label,avg_rate:Number(form.avg_rate)||0,type:form.type,note:form.note})
    setShowForm(false);show('ピンを追加しました')
  }

  const iS={width:'100%',border:'1.5px solid var(--g2)',borderRadius:14,padding:'11px 13px',fontSize:14,fontWeight:600,color:'var(--dark)',background:'#FAFAFA',outline:'none',boxSizing:'border-box',marginBottom:9}

  return (
    <div className="page fade-in" style={{paddingBottom:88}}>
      <Toast/>
      <div style={{background:'var(--white)',borderBottom:'1px solid var(--g2)',padding:'52px 20px 14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:18,fontWeight:900}}>マップ</span>
          <span style={{fontSize:12,color:'var(--g4)'}}>タップでピン追加</span>
        </div>
      </div>

      {/* 地図 */}
      <div style={{position:'relative'}}>
        <div ref={mapRef} style={{width:'100%',height:340}}/>
        {!ready&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--g1)'}}><span style={{color:'var(--g4)',fontSize:14}}>地図を読み込み中…</span></div>}
      </div>

      {/* 凡例 */}
      <div style={{background:'var(--white)',padding:'10px 20px',display:'flex',gap:14,flexWrap:'wrap',borderBottom:'8px solid var(--g1)'}}>
        {[['¥2000+','var(--green)'],['¥1500+','var(--blue)'],['¥1000+','var(--orange)'],['地雷','var(--red)']].map(([l,c])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:c.replace('var(--green)','#00B248').replace('var(--blue)','#0057CC').replace('var(--orange)','#E06400').replace('var(--red)','#E8192C')}}/>
            <span style={{fontSize:11,color:'var(--g4)'}}>{l}</span>
          </div>
        ))}
      </div>

      {/* ピン一覧 */}
      {pins.length>0&&(
        <div style={{background:'var(--white)'}}>
          <div style={{padding:'14px 20px 4px',fontSize:13,fontWeight:700}}>ピン一覧</div>
          {pins.map((pin,i)=>(
            <div key={pin.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 20px',borderTop:i>0?'1px solid var(--g2)':'none'}}>
              <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,
                background:pin.type==='trouble'?'#E8192C':rateColor(pin.avg_rate).replace('var(--green)','#00B248').replace('var(--blue)','#0057CC').replace('var(--orange)','#E06400').replace('var(--red)','#E8192C')}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{pin.label}</div>
                {pin.note&&<div style={{fontSize:11,color:'var(--g4)',marginTop:1}}>{pin.note}</div>}
              </div>
              <span style={{fontSize:14,fontWeight:700,fontFamily:'Inter,sans-serif',color:pin.type==='trouble'?'var(--red)':rateColor(pin.avg_rate)}}>{pin.type==='trouble'?'地雷':`¥${pin.avg_rate.toLocaleString()}/h`}</span>
              <button onClick={()=>{deletePin(pin.id);show('削除しました','warn')}}
                style={{width:28,height:28,borderRadius:8,border:'1px solid var(--g2)',background:'var(--g1)',color:'var(--g4)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* ピン追加フォーム */}
      {showForm&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="sheet">
            <div style={{padding:'12px 20px 0',borderBottom:'1px solid var(--g2)'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><div style={{width:40,height:4,borderRadius:2,background:'var(--g2)'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:12}}>
                <span style={{fontSize:17,fontWeight:700}}>📍 ピンを追加</span>
                <button onClick={()=>setShowForm(false)} style={{fontSize:22,color:'var(--g4)',lineHeight:1}}>×</button>
              </div>
            </div>
            <div style={{padding:'16px 20px 48px'}}>
              {pending&&<div style={{fontSize:11,color:'var(--g4)',fontFamily:'Inter,sans-serif',marginBottom:12}}>{pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}</div>}
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                {[['area','稼ぎエリア'],['trouble','地雷・注意']].map(([t,l])=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                    style={{flex:1,padding:'11px',borderRadius:14,cursor:'pointer',border:`1.5px solid ${form.type===t?'var(--red)':'var(--g2)'}`,background:form.type===t?'#FFF0F1':'#FAFAFA',color:form.type===t?'var(--red)':'var(--g5)',fontSize:13,fontWeight:700}}>
                    {l}
                  </button>
                ))}
              </div>
              <input placeholder="名前（例：渋谷・○○マンション）" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} style={iS}/>
              {form.type==='area'&&<input type="number" placeholder="平均時給（例：1800）" value={form.avg_rate} onChange={e=>setForm(f=>({...f,avg_rate:e.target.value}))} style={iS}/>}
              <input placeholder="メモ（任意）" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{...iS,marginBottom:16}}/>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowForm(false)} style={{flex:1,padding:'13px',background:'var(--g1)',border:'none',borderRadius:14,color:'var(--g5)',fontWeight:600,cursor:'pointer',fontSize:14}}>キャンセル</button>
                <button onClick={handleAdd} disabled={!form.label}
                  style={{flex:1,padding:'13px',background:form.label?'var(--red)':'#EBEBEB',border:'none',borderRadius:14,color:form.label?'#fff':'var(--g3)',fontWeight:700,cursor:form.label?'pointer':'default',fontSize:14}}>
                  追加する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}