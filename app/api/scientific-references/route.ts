import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const openAlexUrl = `https://api.openalex.org/works?search=${encodedQuery}&per-page=4&sort=relevance_score:desc`;

    const response = await fetch(openAlexUrl, {
      headers: {
        'User-Agent': 'MegaProyecto-ScientificExplorer/1.0 (mailto:teheransmit@gmail.com)',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenAlex responded with status ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).map((work: any) => {
      // Reconstruct abstract from inverted index if present
      let abstract = 'Resumen no disponible directamente en el índice.';
      if (work.abstract_inverted_index) {
        const words: [string, number][] = [];
        for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
          for (const pos of positions as number[]) {
            words.push([word, pos]);
          }
        }
        words.sort((a, b) => a[1] - b[1]);
        abstract = words.map((w) => w[0]).join(' ').slice(0, 300) + '...';
      }

      const authors = (work.authorships || [])
        .slice(0, 3)
        .map((a: any) => a.author?.display_name)
        .filter(Boolean)
        .join(', ');

      return {
        id: work.id,
        title: work.title || 'Sin título',
        publicationYear: work.publication_year,
        doi: work.doi || `https://openalex.org/${work.id.replace('https://openalex.org/', '')}`,
        authors: authors || 'Autores no especificados',
        citedByCount: work.cited_by_count || 0,
        isOpenAccess: work.open_access?.is_oa || false,
        oaUrl: work.open_access?.oa_url || work.doi,
        hostVenue: work.primary_location?.source?.display_name || 'Publicación Científica',
        abstract,
      };
    });

    return NextResponse.json({
      success: true,
      query,
      totalFound: data.meta?.count || 0,
      papers: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al consultar la literatura científica',
      },
      { status: 500 }
    );
  }
}
