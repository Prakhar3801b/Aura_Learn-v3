'use client';

interface Resource {
    title: string;
    query?: string;
    site?: string;
    url_hint?: string;
}

interface ExternalResourcesProps {
    resources: {
        youtube: Resource[];
        articles: Resource[];
        academic: Resource[];
    };
}

export default function ExternalResources({ resources }: ExternalResourcesProps) {
    if (!resources) return <div>No resources suggested yet.</div>;

    const renderSection = (title: string, items: Resource[], icon: string) => (
        <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>
                <span>{icon}</span> {title}
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {items.map((item, i) => (
                    <div 
                        key={i}
                        onClick={() => {
                            const query = item.query || item.title;
                            const searchUrl = title === 'YouTube Videos' 
                                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
                                : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                            window.open(searchUrl, '_blank');
                        }}
                        style={{ 
                            padding: '1rem', 
                            background: 'var(--surface)', 
                            borderRadius: '12px', 
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        className="resource-card-hover"
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{item.title}</div>
                            {item.site && <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{item.site}</div>}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>↗</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>🌐 Recommended External Study Material</h3>
            {renderSection('YouTube Videos', resources.youtube || [], '🎬')}
            {renderSection('Articles & Guides', resources.articles || [], '📖')}
            {renderSection('Academic & Research', resources.academic || [], '🎓')}
        </div>
    );
}
