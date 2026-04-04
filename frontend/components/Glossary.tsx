'use client';

interface KeyTerm {
    term: string;
    definition: string;
}

interface GlossaryProps {
    terms: KeyTerm[];
}

export default function Glossary({ terms }: GlossaryProps) {
    if (!terms || terms.length === 0) return <div>No key terms extracted yet.</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>📚 Key Concepts Glossary</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {terms.map((item, i) => (
                    <div 
                        key={i} 
                        style={{ 
                            padding: '1.25rem', 
                            background: 'var(--input-bg)', 
                            borderRadius: '12px', 
                            border: '1px solid var(--border)' 
                        }}
                    >
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', fontSize: '1rem' }}>
                            {item.term}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
                            {item.definition}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
