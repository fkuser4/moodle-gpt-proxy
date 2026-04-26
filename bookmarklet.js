javascript:(async function(){
  var a='https://moodle-gpt-proxy.vercel.app/api';
  var k='REPLACE_WITH_YOUR_OPENAI_API_KEY';
  var q=document.querySelectorAll('.que');
  console.log('[GPT] pitanja='+q.length);
  for(var i=0;i<q.length;i++){
    try{
      var c=q[i].cloneNode(true);
      c.querySelectorAll('script,style,svg,img,video,audio,iframe,noscript').forEach(function(e){e.remove()});
      c.querySelectorAll('.questionflag,.info,.grade,.state,.submitbtns,.activity-navigation,.notifications,#quiz-timer-wrapper').forEach(function(e){e.remove()});
      var h=['id','name','type','value','checked','class','for','aria-labelledby','selected','disabled'];
      c.querySelectorAll('*').forEach(function(e){
        Array.from(e.attributes).forEach(function(b){if(h.indexOf(b.name)<0)e.removeAttribute(b.name)});
        if(e.getAttribute('class')==='')e.removeAttribute('class')
      });
      var g=c.outerHTML.replace(/>\s+</g,'><').trim();
      var p='Riješi ovo Moodle pitanje. Koristi getElementById za ID-eve s dvotočkama. Trigger change/input eventove gdje treba. HTML pitanja:\n'+g;
      var r=await fetch(a,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+k},
        body:JSON.stringify({question:p})
      });
      if(!r.ok){console.error('[GPT] API err',r.status,await r.text());continue}
      var d=await r.json();
      var x=(d.code||'').trim();
      if(x){
        try{new Function(x)();console.log('[GPT] Q'+(i+1)+' OK')}
        catch(e){console.error('[GPT] Q'+(i+1)+' exec err',e);console.log('[GPT] CODE:',x)}
      }else{
        console.log('[GPT] Q'+(i+1)+' prazno',d)
      }
    }catch(e){console.error('[GPT] Q'+(i+1),e)}
  }
  console.log('[GPT] kraj')
})();
