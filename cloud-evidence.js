import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const api='https://tyxdoyiqltanvozrpxtu.supabase.co';
const key='sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio';
const client=createClient(api,key,{auth:{detectSessionInUrl:true,persistSession:true}});
const evidenceNode=document.getElementById('evidence');
const area=document.createElement('section');
area.id='cloudEvidencePanel';
area.className='cloud-evidence-panel';
area.innerHTML='<h3>☁️ رفع شواهد المؤشر وحفظها سحابيًا</h3><p class="cloud-help" id="cloudAccessHelp">لإضافة الصور والملفات، سجّلي الدخول من خانة «دخول إدارة منصة الجودة» أعلى الصفحة. ستظهر استمارة الرفع هنا فور تفعيل صلاحية حسابك. لا يلزم أعضاء الفريق التعامل مع أي برمجيات.</p><div id="cloudEvidenceItems"></div><form id="cloudEvidenceForm" class="cloud-upload-form hidden"><label>عنوان الشاهد<input id="cloudTitle" required maxlength="300" placeholder="عنوان واضح للدليل"></label><label>وصف الشاهد<textarea id="cloudDescription" maxlength="2000" placeholder="وصف اختياري"></textarea></label><label>اختيار ملف<input id="cloudFile" type="file" required accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xlsx,.pptx"></label><small>المرحلة التجريبية: صور وملفات حتى 5 ميجابايت. دعم الفيديوهات الكبيرة لاحقًا.</small><button class="primary" type="submit">حفظ الشاهد سحابيًا</button></form><p id="cloudEvidenceStatus" role="status"></p>';
evidenceNode.after(area);
const $=id=>document.getElementById(id);
let session=null,indicators=[],permissionRole=null;
async function call(route,options={}){
 const url=api+'/functions/v1/'+route;
 const resp=await fetch(url,{...options,headers:{apikey:key,authorization:'Bearer '+session.access_token,...options.headers}});
 if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error(e.error||'network_error');}
 return resp;
}
async function init(){
 const auth=await client.auth.getSession();session=auth.data.session;
 if(!session){$('cloudEvidenceStatus').textContent='لرفع دليل جديد: سجّلي الدخول أولًا باستخدام البريد المعتمد.';return;}
 try{
  const response=await call('quality-evidence-api/catalog');
  const catalog=await response.json();indicators=catalog.indicators||[];permissionRole=catalog.role;
  document.body.classList.add('cloud-authenticated');$('cloudAccessHelp').textContent='أنتِ الآن في مساحة الأدلة السحابية. اختاري ملفًا ثم احفظيه، وسيظهر للشخص المخوّل ضمن هذا المؤشر.';
  if(['admin','editor'].includes(catalog.role))$('cloudEvidenceForm').classList.remove('hidden');else $('cloudAccessHelp').textContent='لديك صلاحية الاطلاع فقط على الشواهد، وليس رفع الملفات.';
  await render();
 }catch{
  $('cloudEvidenceStatus').textContent='الحساب غير مفعل للوصول إلى أدلة المؤشرات بعد.';
 }
}
async function render(){
 if(!session)return;
 const code=$('codeBadge')?.textContent?.match(/\d+\.\d+\.\d+/)?.[0];
 const indicator=indicators.find(x=>x.code===code);
 const list=$('cloudEvidenceItems');list.replaceChildren();
 if(!indicator){$('cloudEvidenceStatus').textContent='هذا المؤشر قيد الإعداد.';return;}
 $('cloudEvidenceStatus').textContent='';
 try{
  const r=await call('quality-evidence-api/evidence?indicator='+encodeURIComponent(indicator.id));
  const data=await r.json();const items=data.items||[];
  if(!items.length){const el=document.createElement('p');el.className='note';el.textContent='لا توجد أدلة سحابية في هذا المؤشر حتى الآن.';list.append(el);return;}
  for(const row of items){
   const item=row.quality_evidence;if(!item)continue;
   const card=document.createElement('article');card.className='tile';
   const title=document.createElement('h4');title.textContent=item.title;
   const desc=document.createElement('p');desc.textContent=item.description||item.original_filename;
   const status=document.createElement('small');status.textContent=item.status==='approved'?'معتمد':'مسودة';
   const download=document.createElement('button');download.className='secondary';download.textContent='تنزيل الملف';
   download.onclick=async()=>{
    download.disabled=true;
    try{
     const result=await call('quality-evidence-download?id='+encodeURIComponent(item.id));
     const blob=await result.blob();const url=URL.createObjectURL(blob);
     const anchor=document.createElement('a');anchor.href=url;anchor.download=item.original_filename;anchor.click();
     setTimeout(()=>URL.revokeObjectURL(url),10000);
    }catch{alert('تعذر تنزيل الملف. يرجى إعادة المحاولة.')}finally{download.disabled=false;}
   };
   card.append(title,desc,status,document.createElement('br'),download);
   if(['admin','editor'].includes(permissionRole)){
    const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent='✏️ تعديل';
    edit.style.margin='5px';
    edit.onclick=async()=>{
     const nextTitle=prompt('عنوان الشاهد',item.title);
     if(nextTitle===null)return;
     const nextDescription=prompt('وصف الشاهد',item.description||'');
     if(nextDescription===null)return;
     if(!nextTitle.trim()){alert('عنوان الشاهد مطلوب.');return;}
     edit.disabled=true;
     try{
      await call('quality-evidence-manage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'update',id:item.id,title:nextTitle.trim(),description:nextDescription.trim()})});
      await render();
     }catch{alert('تعذر حفظ التعديل.');edit.disabled=false;}
    };
    const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='🗑️ حذف';
    remove.style.margin='5px';
    remove.onclick=async()=>{
     if(!confirm('هل تريدين حذف هذا الشاهد وملفه السحابي نهائيًا؟ لا يمكن التراجع.'))return;
     remove.disabled=true;
     try{
      await call('quality-evidence-manage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'delete',id:item.id})});
      await render();
     }catch{alert('تعذر حذف الشاهد.');remove.disabled=false;}
    };
    card.append(edit,remove);
   }
   list.append(card);
  }
 }catch{$('cloudEvidenceStatus').textContent='تعذر تحديث الأدلة السحابية حاليًا.';}
}
$('cloudEvidenceForm').addEventListener('submit',async e=>{
 e.preventDefault();const code=$('codeBadge')?.textContent?.match(/\d+\.\d+\.\d+/)?.[0];
 const indicator=indicators.find(x=>x.code===code),file=$('cloudFile').files[0];
 if(!indicator||!file)return;
 if(file.size>5*1024*1024){$('cloudEvidenceStatus').textContent='الملف أكبر من الحد التجريبي 5 ميجابايت.';return;}
 const body=new FormData();body.append('file',file);body.append('indicator_id',indicator.id);body.append('title',$('cloudTitle').value);body.append('description',$('cloudDescription').value);
 const btn=e.target.querySelector('button');btn.disabled=true;$('cloudEvidenceStatus').textContent='جارٍ رفع الشاهد...';
 try{
  const response=await call('quality-evidence-upload',{method:'POST',body});const data=await response.json();
  $('cloudEvidenceStatus').textContent=data.success?'تم حفظ الشاهد كمسودة.':'لم يكتمل الحفظ.';
  e.target.reset();await render();
 }catch(error){$('cloudEvidenceStatus').textContent='لم ينجح الرفع: '+error.message;}finally{btn.disabled=false;}
});
document.getElementById('indicatorList').addEventListener('click',()=>setTimeout(render,0));
document.getElementById('standards').addEventListener('click',()=>setTimeout(render,0));
document.addEventListener('quality-indicator-changed',()=>setTimeout(render,0));
client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'){setTimeout(()=>init(),200);}else if(event==='SIGNED_OUT'){session=null;document.body.classList.remove('cloud-authenticated');$('cloudEvidenceForm').classList.add('hidden');$('cloudAccessHelp').textContent='سجّلي الدخول من أعلى الصفحة لرفع الأدلة.';}});
init();
document.addEventListener('quality-login-ready',()=>init());
document.addEventListener('quality-logout-ready',()=>{session=null;document.body.classList.remove('cloud-authenticated');$('cloudEvidenceForm').classList.add('hidden');$('cloudEvidenceItems').replaceChildren();});
