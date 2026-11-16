import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const api='https://tyxdoyiqltanvozrpxtu.supabase.co';
const pub='sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio';
const redirect='https://rabadmoh-source.github.io/alhazm-quality/';
const client=createClient(api,pub,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const form=$('adminLoginForm'), message=$('adminLoginMessage'), email=$('adminEmail'), password=$('adminPassword');
const login=$('adminLoginButton'), signup=$('adminSignupButton'), logout=$('adminLogoutButton'), reset=$('adminResetPasswordButton'), setup=$('adminPasswordSetup');
function status(text){message.textContent=text;}
function loggedIn(active){login.classList.toggle('hidden',active);signup.classList.toggle('hidden',active);logout.classList.toggle('hidden',!active);password.classList.toggle('hidden',active);password.required=!active;email.classList.toggle('hidden',active);email.required=!active;}
form.addEventListener('submit',async e=>{
 e.preventDefault();login.disabled=true;status('جارٍ تسجيل الدخول...');
 try{
  const {error}=await client.auth.signInWithPassword({email:email.value.trim(),password:password.value});
  if(error){status('تعذر الدخول. تأكدي من البريد وكلمة المرور، أو اختاري «تعيين / نسيت كلمة المرور».');return;}
  password.value='';loggedIn(true);status('تم تسجيل الدخول بنجاح. جارٍ تفعيل لوحة الأدلة...');
  await activate();
  location.reload();
 }catch{status('تعذر الاتصال بخدمة الدخول. حاولي مجددًا.');}
 finally{login.disabled=false;}
});
signup.addEventListener('click',async()=>{
 const address=email.value.trim(),secret=password.value;
 if(!address||!secret){status('أدخلي البريد الإلكتروني وكلمة المرور التي تريدين استخدامها، ثم اضغطي «تسجيل حساب جديد».');return;}
 if(secret.length<8){status('يرجى اختيار كلمة مرور من 8 أحرف على الأقل.');return;}
 signup.disabled=true;status('جارٍ إنشاء الحساب...');
 try{
  const {data,error}=await client.auth.signUp({email:address,password:secret,options:{emailRedirectTo:redirect}});
  if(error){status('تعذر إنشاء الحساب: '+error.message);return;}
  if(!data.session){status('إذا كان هذا بريدًا جديدًا، تحققي من رسالة تأكيد الحساب مرة واحدة، ثم اضغطي «دخول الإدارة». إذا كان البريد مسجلًا سابقًا فلن يُنشأ حساب ثانٍ، ولا تتغير كلمة مروره بهذه الطريقة.');return;}
  status('أُنشئ الحساب. ستُفعّل صلاحية الفريق بعد اعتماد الإدارة.');
  await activate();
 }catch{status('تعذر الاتصال بخدمة الحسابات.');}
 finally{signup.disabled=false;}
});
reset.addEventListener('click',async()=>{
 const {data:{session}}=await client.auth.getSession();
 if(session){setup.classList.remove('hidden');status('أدخلي كلمة المرور الجديدة مرتين ثم احفظيها.');return;}
 const address=email.value.trim();
 if(!address){status('أدخلي بريدك الإلكتروني أولًا، ثم اضغطي «تعيين / نسيت كلمة المرور».');email.focus();return;}
 reset.disabled=true;status('جارٍ إرسال رابط تعيين كلمة المرور لمرة واحدة...');
 try{
  const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo:redirect});
  status(error?'تعذر إرسال رابط التعيين: '+error.message:'تم إرسال رابط تعيين كلمة المرور. افتحيه مرة واحدة من بريدك، ثم عيّني كلمة المرور الجديدة. بعد ذلك سيكون الدخول مباشرًا من أي جهاز.');
 }catch{status('تعذر إرسال الرسالة، حاولي مجددًا.');}finally{reset.disabled=false;}
});
setup.addEventListener('submit',async e=>{
 e.preventDefault();
 const next=$('adminNewPassword').value,confirm=$('adminNewPasswordConfirm').value;
 if(next!==confirm){status('كلمتا المرور غير متطابقتين.');return;}
 if(next.length<8){status('اختاري كلمة مرور من 8 أحرف على الأقل.');return;}
 const button=setup.querySelector('button');button.disabled=true;status('جارٍ حفظ كلمة المرور...');
 try{
  const {error}=await client.auth.updateUser({password:next});
  if(error){status('لم تُحفظ كلمة المرور: '+error.message);return;}
  setup.reset();setup.classList.add('hidden');status('تم حفظ كلمة المرور بنجاح! يمكنك الدخول بها من أي جهاز دون رابط بريد جديد.');
  await activate();
 }catch{status('تعذر حفظ كلمة المرور، حاولي مجددًا.');}finally{button.disabled=false;}
});
logout.addEventListener('click',async()=>{
 await client.auth.signOut();loggedIn(false);setup.classList.add('hidden');status('تم تسجيل الخروج.');location.reload();
});
async function activate(){
 const {data:{session}}=await client.auth.getSession();
 if(!session)return;
 const headers={authorization:'Bearer '+session.access_token,apikey:pub};
 try{
  let response=await fetch(api+'/functions/v1/quality-admin-activate',{method:'POST',headers});
  if(!response.ok)response=await fetch(api+'/functions/v1/quality-team',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({action:'activate'})});
  if(!response.ok){status('تم تسجيل الدخول، لكن هذا البريد لم يُضف بعد إلى فريق التقويم.');return;}
  loggedIn(true);status('أهلًا بكِ في إدارة منصة الحزم للجودة. رفع الأدلة متاح ضمن المؤشرات.');
 }catch{status('تم الدخول، لكن تعذر الاتصال بخدمة العضوية مؤقتًا.');}
}
client.auth.onAuthStateChange((event)=>{
 if(event==='PASSWORD_RECOVERY'){setup.classList.remove('hidden');status('اكتمل التحقق من البريد. اختاري الآن كلمة المرور التي ستستخدمينها دائمًا.');}
});
(async()=>{
 try{
  const {data:{session}}=await client.auth.getSession();
  if(session){
    const {data:{user},error}=await client.auth.getUser();
    if(error||!user){await client.auth.signOut({scope:'local'});loggedIn(false);status('أصبحت المنصة جاهزة لإنشاء حسابك الجديد. أدخلي البريد وكلمة المرور ثم اضغطي «تسجيل حساب جديد».');}
    else{loggedIn(true);await activate();}
  }
  else status('للحساب الجديد: أدخلي البريد وكلمة المرور ثم اضغطي «تسجيل حساب جديد». وبعد التأكيد، استخدمي زر «دخول الإدارة» دائمًا.');
 }catch{status('تعذر التحقق من الجلسة الحالية.');}
})();
