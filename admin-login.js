import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const endpoint='https://tyxdoyiqltanvozrpxtu.supabase.co';
const key='sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio';
const client=createClient(endpoint,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=id=>document.getElementById(id);
const form=$('adminLoginForm'),email=$('adminEmail'),password=$('adminPassword'),login=$('adminLoginButton'),signup=$('adminSignupButton'),logout=$('adminLogoutButton'),message=$('adminLoginMessage');
$('adminResetPasswordButton').remove();
$('adminPasswordSetup').remove();
signup.textContent='إنشاء حسابي لأول مرة';
password.minLength=8;
form.closest('.admin-login').querySelector('p').textContent='البريد الإلكتروني وكلمة المرور فقط. إنشاء الحساب مرة واحدة، ثم دخول مباشر من أي جهاز.';
const status=value=>{message.textContent=value;};
function display(session){
 const active=Boolean(session);
 for(const control of [email,password,login,signup])control.classList.toggle('hidden',active);
 logout.classList.toggle('hidden',!active);email.required=!active;password.required=!active;
 if(active)password.value='';
}
async function activate(session){
 const headers={apikey:key,authorization:'Bearer '+session.access_token};
 try{
  const response=await fetch(endpoint+'/functions/v1/quality-admin-activate',{method:'POST',headers});
  status(response.ok?'تم الدخول بنجاح. يمكنك الآن إضافة الأدلة والشواهد.':'تم الدخول، لكن حسابك ينتظر اعتماد صلاحية الإدارة.');
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
 const address=email.value.trim(),secret=password.value;
 if(!address||secret.length<8){status('أدخلي بريدك وكلمة مرور من 8 أحرف على الأقل لإنشاء الحساب مرة واحدة.');return;}
 signup.disabled=true;status('جارٍ إنشاء الحساب...');
 try{
  const {data,error}=await client.auth.signUp({email:address,password:secret,options:{emailRedirectTo:'https://rabadmoh-source.github.io/alhazm-quality/'}});
  if(error){status(error.status===429?'خدمة البريد محدودة مؤقتًا. لا تعيدي المحاولة الآن.':'تعذر إنشاء الحساب: '+error.message);return;}
  if(!data.session){status('تم طلب إنشاء الحساب. إذا وصلتك رسالة تأكيد، افتحيها مرة واحدة ثم عودي للدخول.');return;}
  display(data.session);await activate(data.session);
 }catch{status('تعذر الاتصال مؤقتًا.');}finally{signup.disabled=false;}
});
logout.addEventListener('click',async()=>{
 await client.auth.signOut();display(null);status('تم تسجيل الخروج.');document.dispatchEvent(new Event('quality-logout-ready'));
});
const {data:{session}}=await client.auth.getSession();
display(session);
if(session)await activate(session);else status('أدخلي البريد وكلمة المرور. للحساب الأول فقط استخدمي زر «إنشاء حسابي لأول مرة».');
