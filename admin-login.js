import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const endpoint='https://tyxdoyiqltanvozrpxtu.supabase.co';
const key='sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio';
const client=createClient(endpoint,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=id=>document.getElementById(id);
const form=$('adminLoginForm'),email=$('adminEmail'),password=$('adminPassword'),login=$('adminLoginButton'),signup=$('adminSignupButton'),logout=$('adminLogoutButton'),message=$('adminLoginMessage');
$('adminResetPasswordButton').remove();
$('adminPasswordSetup').remove();
signup.textContent='إنشاء حسابي لأول مرة';
const domainNames=['الإنجاز الدراسي','النمو الشخصي','التدريس والتقويم','مناخ المدرسة وبيئة التعلم','القيادة والإدارة والحوكمة'];
const names=domainNames.flatMap(d=>['رئيسة فريق '+d,'عضوة فريق '+d]);
const registration=document.createElement('div');
registration.style.cssText='display:none;flex-wrap:wrap;gap:8px;align-items:center;width:100%;margin-top:9px';
const fullName=document.createElement('input');
fullName.placeholder='الاسم والقبيلة';fullName.maxLength=150;fullName.autocomplete='name';fullName.setAttribute('aria-label','الاسم والقبيلة');
const roleSelect=document.createElement('select');roleSelect.setAttribute('aria-label','الدور في فريق الجودة');
roleSelect.innerHTML='<option value="">اختاري دورك في فريق الجودة</option>';
for(const value of names){const option=document.createElement('option');option.value=value;option.textContent=value;roleSelect.append(option);}
for(const el of [fullName,roleSelect]){el.style.cssText='border:1px solid #dfd7ed;border-radius:11px;padding:11px;min-width:230px;max-width:100%;background:white';registration.append(el);}
form.after(registration);
const review=document.createElement('section');review.className='hidden';review.style.cssText='background:#fff;border:1px solid #e8dff0;border-radius:16px;padding:16px;margin-top:12px;max-width:100%';
review.innerHTML='<h3 style="margin-top:0">👥 طلبات انضمام فريق الجودة</h3><p>اختيار العضوة لدورها لا يمنحها صلاحيات حتى تعتمدي طلبها.</p><div id="qualityReviewList"></div><button type="button" class="secondary" id="qualityRefreshRequests">تحديث القائمة</button>';
form.closest('.admin-login').after(review);
const api=async(session,action,values={})=>{
 const res=await fetch(endpoint+'/functions/v1/quality-team',{method:'POST',headers:{apikey:key,authorization:'Bearer '+session.access_token,'content-type':'application/json'},body:JSON.stringify({action,...values})});
 return {ok:res.ok,data:await res.json().catch(()=>({}))};
};
async function refreshRequests(session){
 const target=document.getElementById('qualityReviewList');
 target.textContent='جارٍ تحميل الطلبات...';
 const result=await api(session,'listRequests');
 if(!result.ok){target.textContent='تعذر تحميل الطلبات الآن.';return;}
 target.replaceChildren();
 const entries=result.data.members||[];
 if(!entries.length){target.textContent='لا توجد طلبات حتى الآن.';return;}
 for(const member of entries){
  const line=document.createElement('div');line.style.cssText='padding:12px 0;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap';
  const label=document.createElement('span');label.textContent=member.display_name+' — '+member.requested_role+' — '+member.email+(member.status==='approved'?' ✅ معتمدة':' ⏳ بانتظار الاعتماد');
  line.append(label);
  if(member.status==='pending'){
   const button=document.createElement('button');button.type='button';button.className='primary';button.textContent='اعتماد العضوة';
   button.onclick=async()=>{button.disabled=true;const result=await api(session,'approveRequest',{user_id:member.user_id});if(result.ok)await refreshRequests(session);else{status('لم يكتمل اعتماد العضوة.');button.disabled=false;}};
   line.append(button);
  }
  target.append(line);
 }
}
document.getElementById('qualityRefreshRequests').onclick=async()=>{const {data:{session}}=await client.auth.getSession();if(session)await refreshRequests(session);};

password.minLength=8;
form.closest('.admin-login').querySelector('p').textContent='البريد الإلكتروني وكلمة المرور فقط. إنشاء الحساب مرة واحدة، ثم دخول مباشر من أي جهاز.';
const accountBadge=document.createElement('div');
accountBadge.id='qualityAccountBadge';
accountBadge.setAttribute('aria-live','polite');
accountBadge.style.cssText='display:none;align-items:center;gap:9px;max-width:100%;padding:9px 14px;border:1px solid #bce8e3;border-radius:14px;background:#ecfaf8;color:#24545b;font-weight:700;font-size:14px;direction:rtl;overflow-wrap:anywhere';
const accountIcon=document.createElement('span');
accountIcon.textContent='👤';accountIcon.setAttribute('aria-hidden','true');
const accountText=document.createElement('span');
accountBadge.append(accountIcon,accountText);
document.querySelector('.top')?.append(accountBadge);
function showAccount(session,isAdmin=false){
 if(!session){accountBadge.style.display='none';accountText.textContent='';return;}
 const address=session.user?.email||'حساب مسجل';
 accountText.textContent=(isAdmin?'المديرة • رباب العجمية':(session.user?.user_metadata?.display_name||'الحساب الحالي')+' • '+(session.user?.user_metadata?.requested_role||'بانتظار تحديد الدور'))+' | '+address;
 accountBadge.style.display='inline-flex';
}
const status=value=>{message.textContent=value;};
function display(session){
 const active=Boolean(session);
 for(const control of [email,password,login,signup])control.classList.toggle('hidden',active);
 logout.classList.toggle('hidden',!active);email.required=!active;password.required=!active;
 if(active)password.value='';
 showAccount(session);
}
async function activate(session){
 const headers={apikey:key,authorization:'Bearer '+session.access_token};
 try{
  const response=await fetch(endpoint+'/functions/v1/quality-admin-activate',{method:'POST',headers});
  showAccount(session,response.ok);
  status(response.ok?'تم الدخول بنجاح. يمكنك الآن إضافة الأدلة والشواهد.':'تم الدخول، لكن حسابك ينتظر اعتماد صلاحية الإدارة.');
  if(response.ok){review.classList.remove('hidden');await refreshRequests(session);}
  else{
   review.classList.add('hidden');
   const team=await api(session,'request');
   if(team.ok && team.data.status==='approved')status('أهلًا بكِ في فريق الجودة. صلاحياتك مفعّلة.');
   else if(team.ok)status('تم الدخول. طلبك بانتظار اعتماد مديرة المدرسة.');
  }
  document.dispatchEvent(new Event('quality-login-ready'));
 }catch{status('تم الدخول، لكن خدمة الصلاحيات غير متاحة حاليًا.');}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();login.disabled=true;status('جارٍ الدخول...');
 try{
  const {data,error}=await client.auth.signInWithPassword({email:email.value.trim(),password:password.value});
  if(error||!data.session){status('لم ينجح الدخول. تحققي من البريد وكلمة المرور.');return;}
  display(data.session);await activate(data.session);
 }catch{status('تعذر الاتصال مؤقتًا. حاولي مرة أخرى.');}finally{login.disabled=false;}
});
signup.addEventListener('click',async()=>{
 if(registration.style.display==='none'){registration.style.display='flex';signup.textContent='إنشاء الحساب';fullName.focus();return;}
 if(fullName.value.trim().length<3||!roleSelect.value){status('أدخلي الاسم والقبيلة واختاري دورًا واحدًا من القائمة.');return;}
 const address=email.value.trim(),secret=password.value;
 if(!address||secret.length<8){status('أدخلي بريدك وكلمة مرور من 8 أحرف على الأقل لإنشاء الحساب مرة واحدة.');return;}
 signup.disabled=true;status('جارٍ إنشاء الحساب...');
 try{
  const {data,error}=await client.auth.signUp({email:address,password:secret,options:{emailRedirectTo:'https://rabadmoh-source.github.io/alhazm-quality/',data:{display_name:fullName.value.trim(),requested_role:roleSelect.value}}});
  if(error){status(error.status===429?'خدمة البريد محدودة مؤقتًا. لا تعيدي المحاولة الآن.':'تعذر إنشاء الحساب: '+error.message);return;}
  if(!data.session){status('تم طلب إنشاء الحساب. إذا وصلتك رسالة تأكيد، افتحيها مرة واحدة ثم عودي للدخول.');return;}
  display(data.session);await activate(data.session);
 }catch{status('تعذر الاتصال مؤقتًا.');}finally{signup.disabled=false;}
});
logout.addEventListener('click',async()=>{
 await client.auth.signOut();display(null);review.classList.add('hidden');status('تم تسجيل الخروج.');document.dispatchEvent(new Event('quality-logout-ready'));
});
const {data:{session}}=await client.auth.getSession();
display(session);
if(session)await activate(session);else status('أدخلي البريد وكلمة المرور. للحساب الأول فقط استخدمي زر «إنشاء حسابي لأول مرة».');
