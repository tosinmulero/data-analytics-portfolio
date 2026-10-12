/* Accessible navigation + case-study views. No external JS dependencies. */
'use strict';
const DATA_PATH = 'portfolio-projects.json';
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
 const metrics = (project.metrics || []).slice(0,2).map(pair => `<div><strong>${clean(pair[1])}</strong><small>${clean(pair[0])}</small></div>`).join('');
 const first = (project.links || [])[0];
 return `<article class="project-card">${projectImage(project)}<div class="project-content"><span class="project-tag">${clean(project.badge || project.domain)}</span><h3>${clean(project.title)}</h3><p>${clean(project.description)}</p><div class="project-metrics">${metrics}</div><div class="project-actions"><button type="button" class="open-case" data-project="${clean(project.slug)}" aria-label="Read case study for ${clean(project.title)}">Case study →</button>${first?`<a href="${clean(safeUrl(first.url))}" target="_blank" rel="noopener noreferrer" aria-label="View repository for ${clean(project.title)}">GitHub ↗</a>`:''}</div></div></article>`;
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
  const response = await fetch(DATA_PATH, {cache:'no-store'});
  if (!response.ok) throw new Error('Manifest not available');
  const manifest = await response.json();
  if (!Array.isArray(manifest.projects) || !manifest.projects.length) throw new Error('Invalid manifest');
  return manifest.projects.map(normaliseProject);
 } catch(error){return fallback;}
}
function bindCaseButtons(root,projects){$$('.open-case',root).forEach(button=>button.addEventListener('click',()=>showCase(projects.find(p=>p.slug===button.dataset.project))));}
function showCase(project){
 const dialog=$('#project-dialog');const content=$('#dialog-content');if(!dialog||!content||!project)return;
 const stats=(project.metrics||[]).map(p=>`<div><strong>${clean(p[1])}</strong><span>${clean(p[0])}</span></div>`).join('');
 const links=(project.links||[]).map(l=>`<a href="${clean(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer">${clean(l.label)} ↗</a>`).join('');
 content.innerHTML=`<div class="dialog-hero"><img src="${clean(safeUrl(project.image))}" alt="Visual from ${clean(project.title)}" onerror="this.style.display='none'"></div><div class="dialog-body"><span class="project-tag">${clean(project.badge || project.domain)}</span><h2 id="dialog-title">${clean(project.title)}</h2><p>${clean(project.description)}</p><h3>Documented project metrics</h3><div class="dialog-stats">${stats}</div><h3>Tools & methods</h3><p>${clean(project.stack)}</p>${project.note?`<h3>Context & limitations</h3><p class="dialog-note">${clean(project.note)}</p>`:'<h3>About the evidence</h3><p>Explore the repository to review methods, data context and scope before drawing conclusions.</p>'}<h3>Project resources</h3><div class="dialog-links">${links}</div></div>`;
 dialog.showModal();
 const url = new URL(location.href);url.searchParams.set('project',project.slug);history.replaceState(null,'',url);
}
function initDialog(projects){
 const dialog=$('#project-dialog');if(!dialog)return;
 $('#dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{const url=new URL(location.href);url.searchParams.delete('project');history.replaceState(null,'',url);});
 const slug=new URLSearchParams(location.search).get('project');if(slug){const project=projects.find(p=>p.slug===slug);if(project)showCase(project);}
}
function setupProjects(projects){
 const grid=$('#project-grid'); if(!grid)return;
 const count=$('#project-count');const search=$('#project-search');const filters=$$('.filter-button');let active='all';
 const paint=()=>{
  const term=search.value.trim().toLowerCase();
  const matches=projects.filter(p=>(active==='all'||topics(p).includes(active))&&`${p.title} ${p.domain} ${p.stack} ${p.description}`.toLowerCase().includes(term));
  count.textContent=`${matches.length} of ${projects.length} documented projects`;
  grid.innerHTML=matches.length?matches.map(projectCard).join(''):'<div class="empty-results">No matching projects. Try another search or filter.</div>';
  bindCaseButtons(grid,projects);
 };
 filters.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.filter;filters.forEach(b=>{const isActive=b===button;b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive));});paint();}));
 search.addEventListener('input',paint);paint();initDialog(projects);
}
function setupFeatured(projects){const wrapper=$('#featured-projects');if(!wrapper)return;const ids=['nhs-primary-care-intelligence-platform','railnexus-b2b-product-growth-intelligence','railpartner-360'];const selected=ids.map(id=>projects.find(p=>p.slug===id)).filter(Boolean);wrapper.innerHTML=selected.map(p=>{const first=p.links?.[0];return `<article class="project-card">${projectImage(p)}<div class="project-content"><span class="project-tag">${clean(p.badge)}</span><h3>${clean(p.title)}</h3><p>${clean(p.description)}</p><div class="project-metrics">${p.metrics.slice(0,2).map(m=>`<div><strong>${clean(m[1])}</strong><small>${clean(m[0])}</small></div>`).join('')}</div><div class="project-actions"><a href="projects.html?project=${encodeURIComponent(p.slug)}">Read case study →</a>${first?`<a target="_blank" rel="noopener noreferrer" href="${clean(safeUrl(first.url))}">GitHub ↗</a>`:''}</div></div></article>`;}).join('');}
function setServiceQuery(){const id=new URLSearchParams(location.search).get('service');if(!id)return;const mail=$('.primary-contact .button');if(mail){const subject='Mulero Analytics - '+id.replaceAll('-',' ')+' enquiry';mail.href=`mailto:tosinmulero@gmail.com?subject=${encodeURIComponent(subject)}`;}}
document.addEventListener('DOMContentLoaded',async()=>{navigation();const year=$('#year');if(year)year.textContent=new Date().getFullYear();setServiceQuery();if($('#project-grid')||$('#featured-projects')){const projects=await getProjects();setupProjects(projects);setupFeatured(projects);}});
