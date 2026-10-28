'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gestor Dinámico de Perros (CRUD) para UniPaseo - UPB Montería
 * Permite agregar nuevos perritos, actualizar tarifas y tiempos, o retirarlos cuando un cliente se retira.
 */

import React, { useState } from 'react';
import { DynamicDog } from '@/lib/unipaseoTypes';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Dog,
  DollarSign,
  Clock,
  MapPin,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface DogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dogs: DynamicDog[];
  onSaveDogs: (updatedDogs: DynamicDog[]) => void;
}

const EMOJI_OPTIONS = ['🐕', '🍊', '🍇', '🍌', '🐶', '🐩', '🦮', '🐾', '⭐', '⚡'];
const COLOR_OPTIONS = ['#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#ec4899', '#eab308', '#6366f1'];

export default function DogManagerModal({
  isOpen,
  onClose,
  dogs,
  onSaveDogs,
}: DogManagerModalProps) {
  const [localDogs, setLocalDogs] = useState<DynamicDog[]>(dogs);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);

  // New dog form state
  const [newName, setNewName] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newRate, setNewRate] = useState('7000');
  const [newDuration, setNewDuration] = useState('20');
  const [newAddress, setNewAddress] = useState('Barrio La Castellana');
  const [newEmoji, setNewEmoji] = useState('🐶');
  const [newColor, setNewColor] = useState('#10b981');

  // Edit dog form state
  const [editRate, setEditRate] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editAddress, setEditAddress] = useState<string>('');

  if (!isOpen) return null;

  const handleToggleActive = (id: string) => {
    const updated = localDogs.map((d) =>
      d.id === id ? { ...d, active: !d.active } : d
    );
    setLocalDogs(updated);
    onSaveDogs(updated);
  };

  const handleDeleteDog = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar a ${name} de tu lista de clientes?`)) {
      const updated = localDogs.filter((d) => d.id !== id);
      setLocalDogs(updated);
      onSaveDogs(updated);
    }
  };

  const handleStartEdit = (dog: DynamicDog) => {
    setEditingDogId(dog.id);
    setEditRate(dog.rate);
    setEditDuration(dog.targetMinutes);
    setEditAddress(dog.address);
  };

  const handleSaveEdit = (id: string) => {
    const updated = localDogs.map((d) =>
      d.id === id
        ? {
            ...d,
            rate: Number(editRate) || d.rate,
            targetMinutes: Number(editDuration) || d.targetMinutes,
            address: editAddress || d.address,
          }
        : d
    );
    setLocalDogs(updated);
    onSaveDogs(updated);
    setEditingDogId(null);
  };

  const handleCreateDog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = `DOG_${Date.now().toString(36).toUpperCase()}`;
    const created: DynamicDog = {
      id: newId,
      name: newName.trim(),
      breed: newBreed.trim() || 'Raza amigable',
      owner: newOwner.trim() || 'Particular',
      rate: Number(newRate) || 5000,
      targetMinutes: Number(newDuration) || 15,
      lat: 8.7735 + (Math.random() - 0.5) * 0.005,
      lng: -75.8625 + (Math.random() - 0.5) * 0.005,
      address: newAddress.trim() || 'Montería',
      emoji: newEmoji,
      color: newColor,
      active: true,
    };

    const updated = [...localDogs, created];
    setLocalDogs(updated);
    onSaveDogs(updated);

    // Reset form
    setNewName('');
    setNewBreed('');
    setNewOwner('');
    setIsAddingNew(false);
  };

  const handleResetToDefaults = () => {
    if (confirm('¿Restablecer configuración de clientes a Sienna ($9.000, 30m) y Frida ($5.000, 10m)?')) {
      const defaults: DynamicDog[] = [
        {
          id: 'S',
          name: 'Sienna',
          breed: 'Raza grande activa',
          owner: 'Elena',
          rate: 9000,
          targetMinutes: 30,
          lat: 8.77228,
          lng: -75.85933,
          address: 'Edificio Palmanova',
          color: '#f97316',
          emoji: '🍊',
          active: true,
        },
        {
          id: 'F',
          name: 'Frida',
          breed: 'Criolla enérgica',
          owner: 'Laura',
          rate: 5000,
          targetMinutes: 10,
          lat: 8.77418,
          lng: -75.86532,
          address: 'Castellana 101',
          color: '#8b5cf6',
          emoji: '🍇',
          active: true,
        },
      ];
      setLocalDogs(defaults);
      onSaveDogs(defaults);
    }
  };

  const totalActiveIncome = localDogs
    .filter((d) => d.active)
    .reduce((sum, d) => sum + d.rate, 0);

  const totalActiveMinutes = localDogs
    .filter((d) => d.active)
    .reduce((sum, d) => sum + d.targetMinutes, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-emerald-50/50 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Dog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Gestión de Clientes Caninos
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  ${totalActiveIncome.toLocaleString('es-CO')} COP / día
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Agrega perritos nuevos, ajusta tarifas o desactiva los que ya no paseas ({totalActiveMinutes} min en total).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action row */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isAddingNew ? 'Cancelar Registro' : 'Agregar Nuevo Perro'}
            </button>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              title="Restablecer Sienna 30m y Frida 10m"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Predeterminados (Sienna & Frida)
            </button>
          </div>

          {/* Form to add new dog */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateDog}
              className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-3 animate-in slide-in-from-top-2 duration-200"
            >
              <h3 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Registrar Nuevo Perrito
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Toby, Rocky, Luna"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Dueño(a)</label>
                  <input
                    type="text"
                    placeholder="Ej. Valentina, Carlos"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Tarifa por Paseo ($ COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    placeholder="Ej. 7000"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Duración (Minutos)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    required
                    placeholder="Ej. 20"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Dirección / Edificio en Montería</label>
                  <input
                    type="text"
                    placeholder="Ej. Edificio Los Laureles, Calle 62"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Icono / Emoji</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewEmoji(em)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all ${
                          newEmoji === em
                            ? 'border-indigo-600 bg-white dark:bg-slate-800 shadow-xs scale-110'
                            : 'border-transparent hover:bg-white/60'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Color Identificador</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newColor === col ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Guardar y Activar
                </button>
              </div>
            </form>
          )}

          {/* Dogs List */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              Lista Actual ({localDogs.length} perritos registrados)
            </span>

            {localDogs.map((dog) => {
              const isEditing = editingDogId === dog.id;

              return (
                <div
                  key={dog.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    dog.active
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          Editando {dog.name} {dog.emoji}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(dog.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Tarifa ($ COP)</label>
                          <input
                            type="number"
                            step="500"
                            value={editRate}
                            onChange={(e) => setEditRate(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-bold border rounded-lg dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Duración (min)</label>
                          <input
                            type="number"
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-bold border rounded-lg dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Dirección</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-slate-900 text-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                          style={{ backgroundColor: `${dog.color}25`, border: `2px solid ${dog.color}` }}
                        >
                          {dog.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {dog.name}
                            </h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                dog.active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {dog.active ? 'Activo' : 'Inactivo'}
                            </span>
                            {dog.owner && (
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                ({dog.owner})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="w-3 h-3" />${dog.rate.toLocaleString('es-CO')}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                              <Clock className="w-3 h-3" />{dog.targetMinutes} min
                            </span>
                            <span className="flex items-center gap-1 truncate text-slate-400 text-[10px]">
                              <MapPin className="w-3 h-3 shrink-0" />{dog.address}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(dog.id)}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            dog.active
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {dog.active ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(dog)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Editar tarifa o minutos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDog(dog.id, dog.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Eliminar perro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-[11px] text-slate-500">
            Santiago: Cambios guardados automáticamente en tu dispositivo.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
