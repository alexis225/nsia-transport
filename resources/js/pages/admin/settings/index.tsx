import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { AmountInput } from '@/components/amount-input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { Settings, Check } from 'lucide-react';

interface Props {
    nn300Ceiling: number;
    treatyLimit: number;
}

export default function SettingsIndex({ nn300Ceiling, treatyLimit }: Props) {
    const { t } = useTranslation('adminSettings');
    const { t: tc } = useTranslation('common');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb') },
    ];
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        nn300_ceiling: String(nn300Ceiling),
        treaty_limit:  String(treatyLimit),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.settings.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('title')}/>
            <style>{`
                .set-wrap{width:100%;max-width:640px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .set-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;}
                .set-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .set-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .set-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .set-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .set-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .set-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .set-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .set-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
                .set-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="set-wrap">
                    <div className="set-hero">
                        <div className="set-hero-ico"><Settings size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div>
                            <div className="set-hero-title">{t('heading')}</div>
                            <div className="set-hero-sub">{t('subtitle')}</div>
                        </div>
                    </div>

                    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                        <div className="set-card">
                            <div className="set-card-hdr">
                                <div className="set-card-ttl">{t('ceilings.title')}</div>
                                <div className="set-card-sub">
                                    {t('ceilings.description')}
                                </div>
                            </div>
                            <div className="set-card-body">
                                <div className="grid gap-2">
                                    <Label className="set-label">{t('ceilings.nn300Label')}</Label>
                                    <AmountInput className="h-11" value={data.nn300_ceiling} onChange={v => setData('nn300_ceiling', v)}/>
                                    <InputError message={errors.nn300_ceiling}/>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="set-label">{t('ceilings.treatyLabel')}</Label>
                                    <AmountInput className="h-11" value={data.treaty_limit} onChange={v => setData('treaty_limit', v)}/>
                                    <InputError message={errors.treaty_limit}/>
                                    <p style={{ fontSize:11, color:'#94a3b8' }}>
                                        {t('ceilings.treatyHint')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? t('saving') : <><Check size={14}/> {tc('actions.save')}</>}
                            </Button>
                            {recentlySuccessful && <span className="status-ok"><Check size={13}/> {t('saved')}</span>}
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
