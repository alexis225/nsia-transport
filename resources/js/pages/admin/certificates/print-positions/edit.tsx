import { Head, Link, router, useForm } from '@inertiajs/react';
import type { TFunction } from 'i18next';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    FileUp,
    RotateCcw,
    Save,
    FileText,
    Wand2,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { DEFAULT_POSITIONS_BY_TEMPLATE } from '../print-templates/default-positions-by-template';
import type { FieldPosition } from '../print-templates/overlay-types';
import {
    convertPdfmeExport,
    isPdfmeExport,
    pdfmeBasePdfToFile,
} from '../print-templates/pdfme-import';
import { getTemplate } from '../print-templates/registry';

interface Override {
    positions: FieldPosition[] | null;
    base_pdf_url: string | null;
    updated_at: string | null;
}

interface Props {
    templateId: string;
    override: Override | null;
}

// Valide la forme minimale attendue (cf. overlay-types.ts) — ne bloque pas
// sur les champs optionnels, seulement sur ce qui ferait planter le rendu.
function validatePositions(value: unknown, t: TFunction): string | null {
    if (!Array.isArray(value)) {
        return t('printPositions.edit.validation.mustBeArray');
    }

    if (value.length === 0) {
        return t('printPositions.edit.validation.arrayEmpty');
    }

    for (const [i, item] of value.entries()) {
        if (typeof item !== 'object' || item === null) {
            return t('printPositions.edit.validation.itemMustBeObject', {
                index: i + 1,
            });
        }

        const f = item as Record<string, unknown>;

        if (typeof f.key !== 'string' || !f.key) {
            return t('printPositions.edit.validation.keyRequired', {
                index: i + 1,
            });
        }

        if (typeof f.top !== 'number') {
            return t('printPositions.edit.validation.topRequired', {
                index: i + 1,
                key: f.key,
            });
        }

        if (typeof f.left !== 'number') {
            return t('printPositions.edit.validation.leftRequired', {
                index: i + 1,
                key: f.key,
            });
        }
    }

    return null;
}

export default function PrintPositionsEdit({ templateId, override }: Props) {
    const { t } = useTranslation('certificateTemplates');
    const meta = getTemplate(templateId);
    const defaultPositions = DEFAULT_POSITIONS_BY_TEMPLATE[templateId] ?? [];
    const initialJson = useMemo(
        () => JSON.stringify(override?.positions ?? defaultPositions, null, 2),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const { data, setData, post, processing, errors } = useForm({
        positions: initialJson,
        base_pdf: null as File | null,
    });

    const [saved, setSaved] = useState(false);
    const [conversionNote, setConversionNote] = useState<string | null>(null);
    const jsonFileRef = useRef<HTMLInputElement>(null);
    const pdfFileRef = useRef<HTMLInputElement>(null);

    const parsed = useMemo(() => {
        try {
            return {
                value: JSON.parse(data.positions) as unknown,
                error: null as string | null,
            };
        } catch {
            return { value: null, error: t('printPositions.edit.invalidJson') };
        }
    }, [data.positions, t]);

    // Export brut du Designer pdfme collé/importé tel quel — proposé à la
    // conversion plutôt que rejeté comme JSON invalide (cf. pdfme-import.ts).
    const pdfmeExport =
        !parsed.error && isPdfmeExport(parsed.value) ? parsed.value : null;

    const validationError = pdfmeExport
        ? null
        : (parsed.error ??
          (parsed.value ? validatePositions(parsed.value, t) : null));
    const fieldCount =
        !validationError && !pdfmeExport && Array.isArray(parsed.value)
            ? parsed.value.length
            : null;

    function handleConvertPdfme() {
        if (!pdfmeExport) {
            return;
        }

        const { positions, skippedFields, skippedPages } =
            convertPdfmeExport(pdfmeExport);
        setData('positions', JSON.stringify(positions, null, 2));
        setData(
            'base_pdf',
            pdfmeBasePdfToFile(pdfmeExport.basePdf, `${templateId}.pdf`),
        );

        const notes = [
            t('printPositions.edit.conversion.fieldsConverted', {
                count: positions.length,
            }),
            t('printPositions.edit.conversion.pdfExtracted'),
        ];

        if (skippedFields > 0) {
            notes.push(
                t('printPositions.edit.conversion.skippedFields', {
                    count: skippedFields,
                }),
            );
        }

        if (skippedPages > 0) {
            notes.push(
                t('printPositions.edit.conversion.skippedPages', {
                    count: skippedPages,
                }),
            );
        }

        setConversionNote(notes.join(' — '));
    }

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('printPositions.breadcrumbs.certificates'),
            href: '/admin/certificates',
        },
        {
            title: t('printPositions.breadcrumbs.printModels'),
            href: '/admin/certificates/print-models',
        },
        {
            title: t('printPositions.breadcrumbs.fieldPositions'),
            href: '/admin/certificate-print-templates',
        },
        {
            title: meta?.name ?? templateId,
            href: `/admin/certificate-print-templates/${templateId}`,
        },
    ];

    function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result ?? '');
            setConversionNote(null);

            try {
                setData('positions', JSON.stringify(JSON.parse(text), null, 2));
            } catch {
                setData('positions', text);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (validationError || pdfmeExport) {
            return;
        }

        post(
            route('admin.certificate-print-templates.update', { templateId }),
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                },
            },
        );
    }

    function handleReset() {
        if (
            !confirm(
                t('printPositions.edit.confirmReset', {
                    name: meta?.name ?? templateId,
                }),
            )
        ) {
            return;
        }

        router.delete(
            route('admin.certificate-print-templates.destroy', { templateId }),
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t('printPositions.edit.headTitle', {
                    name: meta?.name ?? templateId,
                })}
            />

            <div
                style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}
            >
                {/* En-tête */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <span style={{ fontSize: 32 }}>
                            {meta?.countryFlag ?? '📄'}
                        </span>
                        <div>
                            <h1
                                style={{
                                    fontSize: 19,
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    margin: 0,
                                }}
                            >
                                {meta?.name ?? templateId}
                            </h1>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    margin: 0,
                                }}
                            >
                                <code
                                    style={{
                                        background: '#f1f5f9',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                    }}
                                >
                                    {templateId}
                                </code>
                                {' — '}
                                {meta?.description}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/certificate-print-templates"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 12.5,
                            color: '#64748b',
                            textDecoration: 'none',
                        }}
                    >
                        <ArrowLeft size={14} />{' '}
                        {t('printPositions.edit.backToList')}
                    </Link>
                </div>

                <form
                    onSubmit={submit}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                    }}
                >
                    {/* PDF de référence */}
                    <div
                        style={{
                            background: '#fff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '16px 20px',
                        }}
                    >
                        <p
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 4px',
                            }}
                        >
                            {t('printPositions.edit.referencePdf.title')}
                        </p>
                        <p
                            style={{
                                fontSize: 12,
                                color: '#64748b',
                                margin: '0 0 10px',
                            }}
                        >
                            {t('printPositions.edit.referencePdf.subtitle')}
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                            }}
                        >
                            {override?.base_pdf_url && (
                                <a
                                    href={override.base_pdf_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 12.5,
                                        color: '#1d4ed8',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <FileText size={14} />{' '}
                                    {t(
                                        'printPositions.edit.referencePdf.viewCurrent',
                                    )}
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => pdfFileRef.current?.click()}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 7,
                                    background: '#fff',
                                    cursor: 'pointer',
                                    color: '#334155',
                                }}
                            >
                                <FileUp size={13} />{' '}
                                {data.base_pdf
                                    ? data.base_pdf.name
                                    : t(
                                          'printPositions.edit.referencePdf.choose',
                                      )}
                            </button>
                            <input
                                ref={pdfFileRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                style={{ display: 'none' }}
                                onChange={(e) =>
                                    setData(
                                        'base_pdf',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </div>
                        {errors.base_pdf && (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#dc2626',
                                    marginTop: 8,
                                }}
                            >
                                {errors.base_pdf}
                            </p>
                        )}
                    </div>

                    {/* JSON des positions */}
                    <div
                        style={{
                            background: '#fff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '16px 20px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                                flexWrap: 'wrap',
                                gap: 8,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    margin: 0,
                                }}
                            >
                                {t('printPositions.edit.positionsJson.title')}
                            </p>
                            <button
                                type="button"
                                onClick={() => jsonFileRef.current?.click()}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 7,
                                    background: '#fff',
                                    cursor: 'pointer',
                                    color: '#334155',
                                }}
                            >
                                <FileUp size={13} />{' '}
                                {t('printPositions.edit.positionsJson.import')}
                            </button>
                            <input
                                ref={jsonFileRef}
                                type="file"
                                accept="application/json,.json"
                                style={{ display: 'none' }}
                                onChange={handleImportJson}
                            />
                        </div>
                        <p
                            style={{
                                fontSize: 12,
                                color: '#64748b',
                                margin: '0 0 10px',
                            }}
                        >
                            {t('printPositions.edit.positionsJson.descIntro')}
                            <code>
                                {
                                    '{ key, top, left, width?, fontSize?, align?, bold? }'
                                }
                            </code>
                            {t(
                                'printPositions.edit.positionsJson.descAfterCode',
                            )}
                            <strong>Designer pdfme</strong>
                            {t(
                                'printPositions.edit.positionsJson.descAfterStrong',
                            )}
                            <code>schemas</code>/<code>basePdf</code>
                            {t('printPositions.edit.positionsJson.descEnd')}
                        </p>

                        <textarea
                            value={data.positions}
                            onChange={(e) => {
                                setData('positions', e.target.value);
                                setConversionNote(null);
                            }}
                            spellCheck={false}
                            rows={22}
                            style={{
                                width: '100%',
                                fontFamily:
                                    'ui-monospace, Menlo, Consolas, monospace',
                                fontSize: 12.5,
                                lineHeight: 1.5,
                                padding: '12px 14px',
                                borderRadius: 8,
                                resize: 'vertical',
                                border: `1.5px solid ${validationError ? '#fca5a5' : pdfmeExport ? '#fdba74' : '#e2e8f0'}`,
                                background: '#f8fafc',
                                color: '#0f172a',
                                outline: 'none',
                            }}
                        />

                        {pdfmeExport ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    flexWrap: 'wrap',
                                    marginTop: 10,
                                    padding: '10px 14px',
                                    background: '#fff7ed',
                                    border: '1px solid #fdba74',
                                    borderRadius: 8,
                                }}
                            >
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 12,
                                        color: '#9a3412',
                                    }}
                                >
                                    <Wand2 size={14} />{' '}
                                    {t(
                                        'printPositions.edit.positionsJson.pdfmeDetected',
                                    )}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleConvertPdfme}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        background: '#c2410c',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 7,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Wand2 size={13} />{' '}
                                    {t(
                                        'printPositions.edit.positionsJson.convertNow',
                                    )}
                                </button>
                            </div>
                        ) : validationError ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: '#b91c1c',
                                }}
                            >
                                <AlertTriangle size={13} /> {validationError}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: '#15803d',
                                }}
                            >
                                <CheckCircle2 size={13} />{' '}
                                {t('printPositions.edit.positionsJson.valid', {
                                    count: fieldCount ?? 0,
                                })}
                            </div>
                        )}
                        {conversionNote && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: '#15803d',
                                }}
                            >
                                <CheckCircle2 size={13} /> {conversionNote}
                            </div>
                        )}
                        {errors.positions && (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#dc2626',
                                    marginTop: 4,
                                }}
                            >
                                {errors.positions}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <button
                            type="submit"
                            disabled={
                                processing || !!validationError || !!pdfmeExport
                            }
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 7,
                                padding: '9px 18px',
                                background:
                                    processing || validationError || pdfmeExport
                                        ? '#94a3b8'
                                        : '#1e3a5f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 13.5,
                                cursor:
                                    processing || validationError || pdfmeExport
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                        >
                            <Save size={14} />{' '}
                            {processing
                                ? t('printPositions.edit.saving')
                                : t('printPositions.edit.save')}
                        </button>

                        {saved && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: 12.5,
                                    color: '#15803d',
                                    fontWeight: 600,
                                }}
                            >
                                <CheckCircle2 size={14} />{' '}
                                {t('printPositions.edit.saved')}
                            </span>
                        )}

                        <div style={{ flex: 1 }} />

                        {override && (
                            <button
                                type="button"
                                onClick={handleReset}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '8px 14px',
                                    fontSize: 12.5,
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    background: '#fff',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                }}
                            >
                                <RotateCcw size={13} />{' '}
                                {t('printPositions.edit.reset')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
