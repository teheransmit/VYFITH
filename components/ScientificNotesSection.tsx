'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  ExternalLink,
  PlusCircle,
  FileText,
  Lightbulb,
  CheckCircle2,
  Bookmark,
  Compass,
  Tag,
} from 'lucide-react';
import {
  CuriosityNote,
  ScientificPaper,
  initialCuriosityNotes,
} from '@/lib/notesStore';

export default function ScientificNotesSection() {
  const [notes, setNotes] = useState<CuriosityNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('megaproyecto_scientific_notes');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialCuriosityNotes;
  });
  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<CuriosityNote['category']>('Física & Naturaleza');
  const [isSearching, setIsSearching] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string>('note-colibri');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Guardar en LocalStorage
  const persistNotes = (updated: CuriosityNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem('megaproyecto_scientific_notes', JSON.stringify(updated));
    } catch {}
  };

  const handleAddAndSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    setIsSearching(true);
    setStatusMessage('Buscando artículos científicos en OpenAlex / arXiv...');

    const newId = `note-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    let papersFound: ScientificPaper[] = [];

    try {
      const res = await fetch(`/api/scientific-references?q=${encodeURIComponent(newTopic.trim())}`);
      const data = await res.json();
      if (data.success && data.papers) {
        papersFound = data.papers;
      }
    } catch (err) {
      console.error('Error buscando papers:', err);
    }

    const newNote: CuriosityNote = {
      id: newId,
      topic: newTopic.trim(),
      description: newDesc.trim() || 'Curiosidad capturada espontáneamente durante el día.',
      dateCreated: today,
      category: newCategory,
      status: papersFound.length > 0 ? 'Investigado' : 'Pendiente',
      papers: papersFound,
    };

    const updated = [newNote, ...notes];
    persistNotes(updated);
    setActiveNoteId(newId);
    setNewTopic('');
    setNewDesc('');
    setIsSearching(false);
    setStatusMessage(
      papersFound.length > 0
        ? `✅ ¡Guardado! Se encontraron ${papersFound.length} artículos científicos vinculados.`
        : 'Nota guardada en modo offline. Los artículos se buscarán al sincronizar.'
    );

    setTimeout(() => setStatusMessage(null), 4000);
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  return (
    <section id="scientific-notes-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              <BookOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              Proyecto Notas & Referencias Científicas
            </span>
            <span className="text-xs font-mono text-slate-400">Captura Rápida • OpenAlex & arXiv</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Curiosidades Cotidianas & Literatura Científica
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Escribe cualquier curiosidad espontánea que veas en tu día (ej. el vuelo de un colibrí o el flujo del río Sinú). El sistema guarda tu nota sin conexión y busca automáticamente artículos científicos y libros para que los leas cuando quieras.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center bg-violet-50/70 border border-violet-200 px-4 py-2.5 rounded-2xl">
          <Bookmark className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-bold text-violet-950">
            {notes.length} Notas Investigadas
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="my-4 p-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-900 text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-violet-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Formulario de Captura Rápida */}
      <form onSubmit={handleAddAndSearch} className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            ¿Qué viste hoy o qué curiosidad te llamó la atención?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="md:col-span-2">
            <input
              type="text"
              required
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Ej: ¿Cómo vuelan los colibríes en reversa? o ¿Por qué se deforman los meandros?"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="Física & Naturaleza">Física & Naturaleza</option>
              <option value="Ingeniería & Mecánica">Ingeniería & Mecánica</option>
              <option value="Biología & Vuelo">Biología & Vuelo</option>
              <option value="Astronomía & Cosmos">Astronomía & Cosmos</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Breve descripción o detalle de lo que notaste..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={isSearching}
            className="cursor-pointer w-full sm:w-auto px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            {isSearching ? (
              <>
                <Search className="w-3.5 h-3.5 animate-spin" />
                <span>Investigando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Guardar e Investigar Fuentes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Grid de Exploración: Notas a la izquierda, Artículos a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Lista de Notas Guardadas */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Mis Curiosidades Guardadas
          </span>

          {notes.map((note) => {
            const isSelected = note.id === activeNote?.id;
            return (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`cursor-pointer w-full p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-violet-50/80 border-violet-300 ring-2 ring-violet-200 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-bold">
                    {note.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{note.dateCreated}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{note.topic}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{note.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-violet-700 font-semibold">
                  <BookOpen className="w-3 h-3" />
                  <span>{note.papers.length} artículos indexados</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle y Literatura Científica Indexada */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
          {activeNote ? (
            <div>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                      {activeNote.category}
                    </span>
                    <span className="text-xs text-slate-400">• Registrada el {activeNote.dateCreated}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{activeNote.topic}</h3>
                  <p className="text-xs text-slate-600 mt-1">{activeNote.description}</p>
                </div>
              </div>

              {/* Lista de Papers */}
              <div className="mt-4 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Artículos Científicos & Fuentes Encontradas:
                </span>

                {activeNote.papers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                    No se han consultado artículos aún para esta nota.
                  </div>
                ) : (
                  activeNote.papers.map((paper, idx) => (
                    <div
                      key={paper.id || idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-violet-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900 leading-snug">{paper.title}</h5>
                        {paper.isOpenAccess && (
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Open Access 🔓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                        <span>{paper.authors}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{paper.publicationYear}</span>
                        <span>•</span>
                        <span className="text-violet-700 font-medium">{paper.hostVenue}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {paper.abstract}
                      </p>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">
                          {paper.citedByCount > 0 ? `Citado por ${paper.citedByCount} investigaciones` : 'Publicación indexada'}
                        </span>
                        <a
                          href={paper.oaUrl || paper.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 transition-colors"
                        >
                          <span>Leer Artículo / DOI</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">
              Selecciona una nota para ver sus fuentes científicas.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
