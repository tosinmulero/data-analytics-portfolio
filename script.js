/* Accessible navigation + case-study views. No external JS dependencies. */
'use strict';
const DATA_PATH = 'portfolio-projects.json';
let lastCaseTrigger = null;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clean = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl = value => {try {const url = new URL(String(value), window.location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : '#';} catch {return '#';}};
function navigation() {
 const button = $('.nav-toggle'); const menu = $('#main-nav');
 if (!button || !menu) return;
 const close = () => {menu.classList.remove('open'); button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');};
 button.addEventListener('click', () => {const open = !menu.classList.contains('open');menu.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
 document.addEventListener('keydown', event => {if (event.key === 'Escape' && menu.classList.contains('open')) {close();button.focus();}});
 document.addEventListener('click', event => {if (!menu.contains(event.target) && !button.contains(event.target)) close();});
 $$('#main-nav a').forEach(link => link.addEventListener('click', close));
 window.addEventListener('resize',() => {if(window.innerWidth > 800) close();});
}
function topics(project) {
 const val = `${project.title} ${project.domain} ${project.stack}`.toLowerCase();
 const groups=[];
 if (/power bi|business intelligence|commercial|dashboard|reporting/.test(val)) groups.push('bi');
 if (/engineering|dbt|cloud|mlops|etl|airflow|postgresql/.test(val)) groups.push('engineering');
 if (/machine learning|data science|ai|predictive|experiment|risk|modelling|modeling|sklearn/.test(val)) groups.push('ml');
 if (/nhs|healthcare|primary care|hospital/.test(val)) groups.push('health');
 return groups;
}
function projectImage(project) {
 return `<div class="project-image"><img src="${clean(safeUrl(project.image))}" loading="lazy" alt="Project visual for ${clean(project.title)}" onerror="this.style.display='none'"><span class="image-label">Independent portfolio work</span></div>`;
}
function projectCard(project) {
 const metrics=(project.metrics||[]).slice(0,2).map(pair=>`<div><strong>${clean(pair[1])}</strong><small>${clean(pair[0])}</small></div>`).join('');
 const first=(project.links||[])[0];
 const caseHref=project.slug==='fintech-product-science-lab'?'product-science-lab/':`case-studies/${encodeURIComponent(project.slug)}.html`;
 return `<article class="project-card">${projectImage(project)}<div class="project-content"><span class="project-tag">${clean(project.badge||project.domain)}</span><h3>${clean(project.title)}</h3><p>${clean(project.description)}</p><div class="project-metrics">${metrics}</div><div class="project-actions"><a class="open-case" href="${caseHref}" aria-label="Read full case study for ${clean(project.title)}">Read case study →</a>${first?`<a href="${clean(safeUrl(first.url))}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`:''}</div></div></article>`;
}
function normaliseProject(p) {
 return {
  ...p,
  slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  metrics: (p.metrics || []).map(v=>Array.isArray(v)?v:[v.label, v.value]),
  links: (p.links || []).map(v=>Array.isArray(v)?{label:v[0],url:v[1]}:v),
  image: (p.image || '').replace('https://tosinmulero.github.io/data-analytics-portfolio/images/', 'https://raw.githubusercontent.com/tosinmulero/data-analytics-portfolio/main/images/')
 };
}
async function getProjects() {
 const fallback = (window.MULERO_PROJECT_FALLBACK || []).map(normaliseProject);
 try {
  if (window.location.protocol === 'file:') return fallback;
  const response = await fetch(DATA_PATH);
  if (!response.ok) throw new Error('Manifest not available');
  const manifest = await response.json();
  if (!Array.isArray(manifest.projects) || !manifest.projects.length) throw new Error('Invalid manifest');
  return manifest.projects.map(normaliseProject);
 } catch(error){return fallback;}
}
function setupProjects(projects){
 const legacy=new URLSearchParams(window.location.search).get('project');
 if(legacy&&projects.some(p=>p.slug===legacy)){window.location.replace(`case-studies/${encodeURIComponent(legacy)}.html`);return;}

 const grid=$('#project-grid'); if(!grid)return;
 const count=$('#project-count');const search=$('#project-search');const filters=$$('.filter-button');let active='all';
 const paint=()=>{
  const term=search.value.trim().toLowerCase();
  const matches=projects.filter(p=>(active==='all'||topics(p).includes(active))&&`${p.title} ${p.domain} ${p.stack} ${p.description}`.toLowerCase().includes(term));
  count.textContent=`${matches.length} of ${projects.length} documented projects`;
  grid.innerHTML=matches.length?matches.map(projectCard).join(''):'<div class="empty-results">No matching projects. Try another search or filter.</div>';

 };
 filters.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.filter;filters.forEach(b=>{const isActive=b===button;b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive));});paint();}));
 search.addEventListener('input',paint);paint();
}
function setupFeatured(projects){const wrapper=$('#featured-projects');if(!wrapper)return;const ids=['fintech-product-science-lab','nhs-primary-care-intelligence-platform','railnexus-b2b-product-growth-intelligence'];const selected=ids.map(id=>projects.find(p=>p.slug===id)).filter(Boolean);wrapper.innerHTML=selected.map(p=>{const first=p.links?.[0];return `<article class="project-card">${projectImage(p)}<div class="project-content"><span class="project-tag">${clean(p.badge)}</span><h3>${clean(p.title)}</h3><p>${clean(p.description)}</p><div class="project-metrics">${p.metrics.slice(0,2).map(m=>`<div><strong>${clean(m[1])}</strong><small>${clean(m[0])}</small></div>`).join('')}</div><div class="project-actions"><a href="case-studies/${encodeURIComponent(p.slug)}.html">Read case study →</a>${first?`<a target="_blank" rel="noopener noreferrer" href="${clean(safeUrl(first.url))}">GitHub ↗</a>`:''}</div></div></article>`;}).join('');}
function setServiceQuery(){const id=new URLSearchParams(location.search).get('service');if(!id)return;const mail=$('.primary-contact .button');if(mail){const subject='Mulero Analytics - '+id.replaceAll('-',' ')+' enquiry';mail.href=`mailto:tosinmulero@gmail.com?subject=${encodeURIComponent(subject)}`;}}
function setupCopyContactEmail(){const button=$('#copy-contact-email');const status=$('#copy-email-status');if(!button||!status)return;button.addEventListener('click',async()=>{const email=button.getAttribute('data-email');try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(email);status.textContent='Email address copied.';}catch(error){status.textContent='Copy the email address shown above into your email application.';}});}
document.addEventListener('DOMContentLoaded',async()=>{navigation();setupCopyContactEmail();const year=$('#year');if(year)year.textContent=new Date().getFullYear();setServiceQuery();if($('#project-grid')||$('#featured-projects')){const projects=await getProjects();setupProjects(projects);setupFeatured(projects);}});
