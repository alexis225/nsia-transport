import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useAppearance } from '@/hooks/use-appearance';
import { edit } from '@/routes/profile';
import type { BreadcrumbItem } from '@/types';
import { Palette, Monitor, Sun, Moon, Check, Type, Layout } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres du profil', href: edit() },
    { title: 'Apparence' },
];

type Theme = 'light' | 'dark' | 'system';

const THEMES: { value: Theme; label: string; desc: string; Icon: React.FC<any> }[] = [
    { value:'light',  label:'Clair',   desc:'Interface lumineuse',    Icon: Sun },
    { value:'dark',   label:'Sombre',  desc:'Interface sombre',       Icon: Moon },
    { value:'system', label:'Système', desc:'Suit les préférences OS', Icon: Monitor },
];

const FONT_SIZES = [
    { value:'sm', label:'Petit',  size:'12px' },
    { value:'md', label:'Moyen',  size:'14px' },
    { value:'lg', label:'Grand',  size:'16px' },
];

const ACCENT_COLORS = [
    { value:'blue',   label:'Bleu',   hex:'#1e3a8a' },
    { value:'indigo', label:'Indigo', hex:'#4338ca' },
    { value:'violet', label:'Violet', hex:'#7c3aed' },
    { value:'teal',   label:'Teal',   hex:'#0f766e' },
    { value:'green',  label:'Vert',   hex:'#15803d' },
];

export default function AppearancePage() {
    const { auth }                     = usePage().props as any;
    const user                         = auth?.user;
    const { appearance, updateAppearance } = useAppearance();

    const initials = `${user?.first_name?.[0] ?? user?.name?.[0] ?? 'U'}${user?.last_name?.[0] ?? ''}`.toUpperCase();
    const fullName  = user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.name ?? '');

    const [fontSize,     setFontSize]     = useState('md');
    const [accentColor,  setAccentColor]  = useState('blue');
    const [sidebarState, setSidebarState] = useState('expanded');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apparence — NSIA Transport"/>
            <style>{`
                .ap-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .ap-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:26px 24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .ap-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05);pointer-events:none;}
                .ap-avatar{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;}
                .ap-hero-info{flex:1;position:relative;z-index:1;}
                .ap-hero-name{font-size:17px;font-weight:600;color:#fff;margin-bottom:2px;}
                .ap-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);font-weight:300;}
                .ap-hero-ico{position:relative;z-index:1;width:52px;height:52px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

                .ap-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .ap-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;}
                .ap-card-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .ap-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .ap-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .ap-card-body{padding:22px;display:flex;flex-direction:column;gap:14px;}

                /* Thème grid */
                .theme-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
                .theme-card{border:1.5px solid #e2e8f0;border-radius:11px;padding:16px 12px;cursor:pointer;text-align:center;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:8px;background:#f8fafc;}
                .theme-card:hover{border-color:#94a3b8;background:#f1f5f9;}
                .theme-card.active{border-color:#1e3a8a;background:#eff6ff;}
                .theme-ico{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
                .theme-card.active .theme-ico{background:#dbeafe;}
                .theme-card:not(.active) .theme-ico{background:#f1f5f9;}
                .theme-label{font-size:13px;font-weight:500;color:#1e293b;}
                .theme-desc{font-size:11px;color:#94a3b8;}
                .theme-check{width:18px;height:18px;border-radius:50%;border:1.5px solid #e2e8f0;display:flex;align-items:center;justify-content:center;background:#fff;transition:all .15s;}
                .theme-card.active .theme-check{background:#1e3a8a;border-color:#1e3a8a;}

                /* Font grid */
                .font-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
                .font-card{border:1.5px solid #e2e8f0;border-radius:10px;padding:14px;cursor:pointer;transition:all .15s;text-align:center;background:#f8fafc;}
                .font-card:hover{border-color:#94a3b8;background:#f1f5f9;}
                .font-card.active{border-color:#1e3a8a;background:#eff6ff;}
                .font-sample{color:#1e293b;font-weight:500;margin-bottom:4px;}
                .font-name{font-size:11px;color:#94a3b8;}

                /* Colors */
                .color-grid{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;}
                .color-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;border:2px solid transparent;transition:all .15s;}
                .color-swatch:hover{transform:scale(1.1);}
                .color-swatch.active{border-color:#1e293b;box-shadow:0 0 0 3px rgba(30,58,138,.15);}
                .color-lbl{font-size:10px;color:#64748b;text-align:center;margin-top:3px;}

                /* Sidebar options */
                .sb-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
                .sb-opt{border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .15s;background:#f8fafc;display:flex;align-items:center;gap:10px;}
                .sb-opt:hover{border-color:#94a3b8;background:#f1f5f9;}
                .sb-opt.active{border-color:#1e3a8a;background:#eff6ff;}
                .sb-opt-ttl{font-size:13px;font-weight:500;color:#1e293b;}
                .sb-opt-sub{font-size:11px;color:#94a3b8;margin-top:1px;}

                /* Preview */
                .preview{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-top:4px;}
                .preview-top{height:24px;background:#fff;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;padding:0 10px;gap:4px;}
                .preview-dot{width:6px;height:6px;border-radius:50%;}
                .preview-body{display:grid;grid-template-columns:52px 1fr;height:52px;}
                .preview-sb{background:linear-gradient(180deg,#1e2fa0,#14176a);display:flex;flex-direction:column;gap:4px;padding:6px 5px;}
                .preview-sb-item{height:5px;border-radius:3px;background:rgba(255,255,255,.2);}
                .preview-sb-item.act{background:rgba(255,255,255,.5);}
                .preview-cnt{background:#f8fafc;padding:8px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;align-content:start;}
                .preview-block{background:#fff;border-radius:3px;height:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ap-wrap">

                    {/* Hero */}
                    <div className="ap-hero">
                        <div className="ap-avatar">{initials}</div>
                        <div className="ap-hero-info">
                            <div className="ap-hero-name">{fullName || 'Utilisateur'}</div>
                            <div className="ap-hero-sub">Personnalisation · Thème et préférences visuelles</div>
                        </div>
                        <div className="ap-hero-ico">
                            <Palette size={22} color="rgba(255,255,255,0.7)"/>
                        </div>
                    </div>

                    {/* Thème */}
                    <div className="ap-card">
                        <div className="ap-card-hdr">
                            <div className="ap-card-ico" style={{background:'#fdf4ff'}}><Palette size={17} color="#a855f7"/></div>
                            <div><div className="ap-card-ttl">Thème</div><div className="ap-card-sub">Choisissez l'apparence de l'interface</div></div>
                        </div>
                        <div className="ap-card-body">
                            <div className="theme-grid">
                                {THEMES.map(({ value, label, desc, Icon }) => (
                                    <div key={value} className={`theme-card ${appearance === value ? 'active' : ''}`} onClick={() => updateAppearance(value)}>
                                        <div className="theme-ico"><Icon size={19} color={appearance === value ? '#1d4ed8' : '#94a3b8'}/></div>
                                        <div><div className="theme-label">{label}</div><div className="theme-desc">{desc}</div></div>
                                        <div className="theme-check">{appearance === value && <Check size={10} color="#fff"/>}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Mini preview */}
                            <div className="preview">
                                <div className="preview-top">
                                    <div className="preview-dot" style={{background:'#ef4444'}}/>
                                    <div className="preview-dot" style={{background:'#f59e0b'}}/>
                                    <div className="preview-dot" style={{background:'#22c55e'}}/>
                                </div>
                                <div className="preview-body">
                                    <div className="preview-sb">
                                        <div className="preview-sb-item act"/>
                                        <div className="preview-sb-item"/>
                                        <div className="preview-sb-item"/>
                                    </div>
                                    <div className="preview-cnt">
                                        <div className="preview-block"/><div className="preview-block"/><div className="preview-block"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Taille texte */}
                    <div className="ap-card">
                        <div className="ap-card-hdr">
                            <div className="ap-card-ico" style={{background:'#eff6ff'}}><Type size={17} color="#3b82f6"/></div>
                            <div><div className="ap-card-ttl">Taille du texte</div><div className="ap-card-sub">Ajustez la lisibilité de l'interface</div></div>
                        </div>
                        <div className="ap-card-body">
                            <div className="font-grid">
                                {FONT_SIZES.map(f => (
                                    <div key={f.value} className={`font-card ${fontSize === f.value ? 'active' : ''}`} onClick={() => setFontSize(f.value)}>
                                        <div className="font-sample" style={{fontSize:f.size}}>Aa</div>
                                        <div className="font-name">{f.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Couleur accent */}
                    <div className="ap-card">
                        <div className="ap-card-hdr">
                            <div className="ap-card-ico" style={{background:'#fff7ed'}}><Palette size={17} color="#f97316"/></div>
                            <div><div className="ap-card-ttl">Couleur principale</div><div className="ap-card-sub">Couleur des boutons et éléments actifs</div></div>
                        </div>
                        <div className="ap-card-body">
                            <div className="color-grid">
                                {ACCENT_COLORS.map(c => (
                                    <div key={c.value} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                                        <div className={`color-swatch ${accentColor === c.value ? 'active' : ''}`} style={{background:c.hex}} onClick={() => setAccentColor(c.value)}>
                                            {accentColor === c.value && <Check size={13} color="#fff"/>}
                                        </div>
                                        <span className="color-lbl">{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="ap-card">
                        <div className="ap-card-hdr">
                            <div className="ap-card-ico" style={{background:'#f0fdf4'}}><Layout size={17} color="#16a34a"/></div>
                            <div><div className="ap-card-ttl">Menu latéral</div><div className="ap-card-sub">État par défaut au chargement</div></div>
                        </div>
                        <div className="ap-card-body">
                            <div className="sb-grid">
                                {[{value:'expanded',label:'Déployé',sub:'Menu visible par défaut'},{value:'collapsed',label:'Réduit',sub:'Icônes uniquement'}].map(opt => (
                                    <div key={opt.value} className={`sb-opt ${sidebarState === opt.value ? 'active' : ''}`} onClick={() => setSidebarState(opt.value)}>
                                        <div style={{width:28,height:28,background:sidebarState===opt.value?'#eff6ff':'#f1f5f9',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                            <Layout size={14} color={sidebarState===opt.value?'#1d4ed8':'#94a3b8'}/>
                                        </div>
                                        <div>
                                            <div className="sb-opt-ttl">{opt.label}</div>
                                            <div className="sb-opt-sub">{opt.sub}</div>
                                        </div>
                                        {sidebarState === opt.value && <Check size={13} color="#1d4ed8" style={{marginLeft:'auto',flexShrink:0}}/>}
                                    </div>
                                ))}
                            </div>
                            <p style={{fontSize:12,color:'#94a3b8',fontStyle:'italic'}}>Les préférences sont sauvegardées automatiquement.</p>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}