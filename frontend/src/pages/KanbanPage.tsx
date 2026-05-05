import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter, useDroppable,
  type DragStartEvent, type DragEndEvent, type DragOverEvent, type Announcements,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useKanbanStore } from '../store/kanbanStore'
import { api } from '../services/api'
import { KANBAN_COLUMNS, STATUS_MAP, STATUS_MAP_REVERSE } from '../types/os'
import { Section, Field, inputCls } from '../components/FormHelpers'
import type { OS, OSStatus, KanbanColumn, HistoricoOS, UpdateOSBody } from '../types/os'

//Helpers 

function toKanban(s: string): OSStatus { return STATUS_MAP[s] ?? 'orcamento' }
function colLabel(s: OSStatus) { return KANBAN_COLUMNS.find((c) => c.id === s)?.label ?? s }
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function buildAnnouncements(list: OS[]): Announcements {
  return {
    onDragStart({ active }) {
      const o = list.find((x) => x.id === active.id)
      return o ? `OS de ${o.cliente_nome} em ${colLabel(toKanban(o.status))}. Setas para mover.` : undefined
    },
    onDragOver({ active, over }) {
      if (!over) return
      const o = list.find((x) => x.id === active.id)
      if (!o) return
      const isCol = KANBAN_COLUMNS.some((c) => c.id === over.id)
      const label = isCol ? colLabel(over.id as OSStatus) : colLabel(toKanban(list.find((x) => x.id === over.id)?.status ?? o.status))
      return `Sobre ${label}.`
    },
    onDragEnd({ active, over }) {
      const o = list.find((x) => x.id === active.id)
      if (!o || !over) return 'Cancelado.'
      const isCol = KANBAN_COLUMNS.some((c) => c.id === over.id)
      const label = isCol ? colLabel(over.id as OSStatus) : colLabel(toKanban(list.find((x) => x.id === over.id)?.status ?? o.status))
      return `Movida para ${label}.`
    },
    onDragCancel({ active }) {
      const o = list.find((x) => x.id === active.id)
      return o ? `Cancelado. Retornou para ${colLabel(toKanban(o.status))}.` : 'Cancelado.'
    },
  }
}

type DisplayOS = OS & { _col: OSStatus }

//Hook: largura responsiva da coluna 
function useColumnWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
      ? Math.min(window.innerWidth - 40, 280)
      : 238
  )
  useEffect(() => {
    function update() {
      setWidth(window.innerWidth < 768 ? Math.min(window.innerWidth - 40, 280) : 238)
    }
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])
  return width
}

//Hook: coluna visível (para dots indicator)
function useVisibleColumn(ref: React.RefObject<HTMLDivElement | null>, colWidth: number) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => setIndex(Math.round(el.scrollLeft / (colWidth + 10)))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [ref, colWidth])
  return index
}

//Page

export default function KanbanPage() {
  const queryClient = useQueryClient()
  const { moveOS, resetPosition, positions } = useKanbanStore()

  const boardRef = useRef<HTMLDivElement>(null)
  const colWidth   = useColumnWidth()
  const isMobile   = colWidth < 238
  const visibleCol = useVisibleColumn(boardRef, colWidth)

  const [activeOS, setActiveOS]           = useState<OS | null>(null)
  const [overId, setOverId]               = useState<OSStatus | null>(null)
  const [showHint, setShowHint]           = useState(false)
  const [search, setSearch]               = useState('')
  const [detailOS, setDetailOS]           = useState<OS | null>(null)
  const [novaOSCol, setNovaOSCol]         = useState<OSStatus | null>(null)
  const [justDroppedId, setJustDroppedId] = useState<number | null>(null)

  const { data: osList = [], isLoading, isError } = useQuery({
    queryKey: ['os'],
    queryFn: () => api.os.list(),
    refetchInterval: 30_000,
  })

  const patchStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.os.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['os'] }),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: isMobile ? 8 : 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    })
  )

  //Busca + posições otimistas
  const displayList = useMemo<DisplayOS[]>(() => {
    const q = search.toLowerCase().trim()
    return osList
      .filter((o) =>
        !q ||
        o.cliente_nome.toLowerCase().includes(q) ||
        o.veiculo_placa.toLowerCase().includes(q) ||
        o.veiculo_modelo.toLowerCase().includes(q)
      )
      .map((o) => ({ ...o, _col: positions[o.id] ?? toKanban(o.status) }))
  }, [osList, positions, search])

  const byCol = useMemo(() =>
    KANBAN_COLUMNS.reduce<Record<OSStatus, DisplayOS[]>>((acc, col) => {
      acc[col.id] = displayList.filter((o) => o._col === col.id)
      return acc
    }, {} as Record<OSStatus, DisplayOS[]>),
    [displayList]
  )

  const totalParadas  = useMemo(() => osList.filter((o) => o.alerta_parada).length, [osList])
  const totalVencidas = useMemo(() => osList.filter((o) => o.prazo_vencido).length, [osList])
  const announcements = useMemo(() => buildAnnouncements(osList), [osList])

  // Drag handlers
  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveOS(osList.find((o) => o.id === e.active.id) ?? null)
    setShowHint(true)
  }, [osList])

  const onDragOver = useCallback((e: DragOverEvent) => {
    const { over } = e
    if (!over) { setOverId(null); return }
    const isCol = KANBAN_COLUMNS.some((c) => c.id === over.id)
    // Usa displayList (posições otimistas) para identificar a coluna correta
    setOverId(isCol ? (over.id as OSStatus) : (displayList.find((o) => o.id === over.id)?._col ?? null))
  }, [displayList])

  const onDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveOS(null); setOverId(null); setShowHint(false)
    if (!over) return
    const os = osList.find((o) => o.id === active.id)
    if (!os) return
    const isCol  = KANBAN_COLUMNS.some((c) => c.id === over.id)
    // Usa displayList (posições otimistas) ao calcular a coluna alvo pelo card hover
    const target  = isCol ? (over.id as OSStatus) : (displayList.find((o) => o.id === over.id)?._col ?? toKanban(os.status))
    // Usa a posição otimista como "atual" para evitar comparação com dado desatualizado do servidor
    const current = positions[os.id] ?? toKanban(os.status)
    if (current === target) return
    moveOS(os.id, target)
    setJustDroppedId(os.id)
    setTimeout(() => setJustDroppedId(null), 400)
    try {
      await patchStatus.mutateAsync({ id: os.id, status: STATUS_MAP_REVERSE[target] })
    } catch {
      resetPosition(os.id, current)
    }
  }, [osList, displayList, positions, moveOS, resetPosition, patchStatus])

  const onDragCancel = useCallback(() => {
    setActiveOS(null); setOverId(null); setShowHint(false)
  }, [])

  if (isLoading) return (
    <div role="status" aria-live="polite" className="flex items-center justify-center h-full">
      <span className="font-mono text-[11px] tracking-widest text-[#2a2f42] uppercase animate-pulse">
        Carregando ordens...
      </span>
    </div>
  )

  if (isError) return (
    <div role="alert" className="flex items-center justify-center h-full">
      <span className="font-mono text-[11px] tracking-widest text-[#ff3d5a] uppercase">
        Erro ao carregar. Verifique se o backend está rodando.
      </span>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden -m-4 md:-m-5">

      {showHint && (
        <div role="status" aria-live="polite"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none
                     font-mono text-[10px] tracking-widest text-[#0d0f17]
                     bg-[#00e5d4] px-4 py-1.5 rounded-full">
          ← → Mover &nbsp;·&nbsp; Espaço Confirmar &nbsp;·&nbsp; Esc Cancelar
        </div>
      )}

      {/* Toolbar */}
      <div role="toolbar" aria-label="Ferramentas do Kanban"
        className="flex items-center gap-2 h-11 px-5 border-b border-[#1a1e2e] bg-[#0a0c12] flex-shrink-0">
        <div className="flex items-center gap-2 h-[28px] px-3 rounded-[3px] bg-[#13151c] border border-[#1a1e2e] flex-1 max-w-[340px]">
          <span className="text-[#2a2f42] text-[11px]" aria-hidden>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar por placa, cliente ou modelo"
            placeholder="Buscar por placa, cliente ou modelo..."
            className="bg-transparent border-none outline-none font-mono text-[10px] text-[#8890a8] placeholder-[#525875] w-full"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="font-mono text-[10px] text-[#525875] hover:text-[#8890a8] bg-transparent border-none cursor-pointer">
              ✕
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {patchStatus.isPending && (
            <span className="font-mono text-[9px] text-[#525875] tracking-widest">Salvando...</span>
          )}
          {search && (
            <span className="font-mono text-[9px] tracking-widest text-[#00e5d4]">
              {displayList.length} resultado{displayList.length !== 1 ? 's' : ''}
            </span>
          )}
          {totalVencidas > 0 && (
            <span className="font-mono text-[9px] tracking-widest px-2.5 py-1 rounded-full"
              style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)' }}>
              {totalVencidas} vencida{totalVencidas > 1 ? 's' : ''}
            </span>
          )}
          {totalParadas > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest px-2.5 py-1 rounded-full"
              style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)' }}>
              <span aria-hidden className="w-1 h-1 rounded-full bg-[#ff3d5a] flex-shrink-0" />
              {totalParadas} parada{totalParadas > 1 ? 's' : ''}
            </span>
          )}
          <span className="font-mono text-[9px] tracking-widest text-[#2a2f42]">
            {osList.length} OSs · {KANBAN_COLUMNS.length} colunas
          </span>
        </div>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragStart={onDragStart} onDragOver={onDragOver}
        onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <div
          ref={boardRef}
          role="region"
          aria-labelledby="kanban-heading"
          className="kanban-board flex-1 overflow-x-auto flex gap-2.5 items-start p-4 md:p-5"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          <h2 id="kanban-heading" className="sr-only">Quadro Kanban — Ordens de Serviço</h2>
          {KANBAN_COLUMNS.map((col) => (
            <Column
              key={col.id}
              col={col}
              cards={byCol[col.id] ?? []}
              isOver={overId === col.id}
              colWidth={colWidth}
              justDroppedId={justDroppedId}
              onCardClick={setDetailOS}
              onAddClick={() => setNovaOSCol(col.id)}
            />
          ))}
          <div className="flex-shrink-0 w-1 md:hidden" />
        </div>

        <DragOverlay dropAnimation={{
          duration: 220, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          keyframes({ transform }) {
            return [
              { transform: CSS.Transform.toString(transform.initial), opacity: 1,    scale: '1.02' },
              { transform: CSS.Transform.toString(transform.final),   opacity: 0.85, scale: '1'    },
            ]
          },
        }}>
          {activeOS ? <KanbanCard os={activeOS} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Dots indicator (somente mobile) */}
      {isMobile && (
        <div role="tablist" aria-label="Navegar entre colunas"
          className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0 bg-[#0a0c12] border-t border-[#1a1e2e]">
          {KANBAN_COLUMNS.map((col, i) => {
            const active = visibleCol === i
            return (
              <button
                key={col.id}
                role="tab"
                aria-selected={active}
                aria-label={`Ir para ${col.label}`}
                onClick={() => {
                  const el = boardRef.current
                  if (el) el.scrollTo({ left: i * (colWidth + 10), behavior: 'smooth' })
                }}
                className="rounded-full border-none p-0 cursor-pointer transition-all duration-200"
                style={{ width: active ? 20 : 6, height: 6, background: active ? '#00e5d4' : '#1a1e2e' }}
              />
            )
          })}
        </div>
      )}

      {detailOS && <OSDetailModal os={detailOS} onClose={() => setDetailOS(null)} />}
      {novaOSCol && <NovaOSModal defaultStatus={novaOSCol} onClose={() => setNovaOSCol(null)} />}
    </div>
  )
}

//Column 

function Column({
  col, cards, isOver, colWidth, justDroppedId, onCardClick, onAddClick,
}: {
  col: KanbanColumn
  cards: DisplayOS[]
  isOver: boolean
  colWidth: number
  justDroppedId: number | null
  onCardClick: (os: OS) => void
  onAddClick: () => void
}) {
  const ids = useMemo(() => cards.map((c) => c.id), [cards])
  // Registra a coluna como droppable para receber cards em área vazia
  const { setNodeRef } = useDroppable({ id: col.id })

  return (
    <div ref={setNodeRef} id={col.id} role="group"
      aria-label={`${col.label}, ${cards.length} OS${cards.length !== 1 ? 's' : ''}`}
      className="flex flex-col rounded-[5px] overflow-hidden flex-shrink-0 transition-all duration-150"
      style={{
        width: colWidth, minWidth: colWidth,
        scrollSnapAlign: 'start',
        background: isOver ? '#13151c' : '#0a0c12',
        border: `1px solid ${isOver ? '#00e5d4' : '#1a1e2e'}`,
        borderStyle: isOver ? 'dashed' : 'solid',
      }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ background: col.color }}>
        <span className="font-mono text-[10px] font-bold tracking-widest text-white uppercase">{col.label}</span>
        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.65)' }}>
          {cards.length}
        </span>
      </div>

      <SortableContext id={col.id} items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5 p-2 min-h-[56px] flex-1">
          {cards.length === 0 ? (
            <div className="font-mono text-[9px] tracking-widest text-center py-5 transition-colors duration-150"
              style={{ color: isOver ? '#00e5d4' : '#1a1e2e' }}>
              {isOver ? 'Solte aqui' : 'Nenhuma OS aqui'}
            </div>
          ) : cards.map((os) => (
            <KanbanCard
              key={os.id}
              os={os}
              justDropped={os.id === justDroppedId}
              onClick={() => onCardClick(os)}
            />
          ))}
        </div>
      </SortableContext>

      <div className="px-2 py-1.5 border-t border-[#1a1e2e]">
        <button onClick={onAddClick}
          className="font-mono text-[9px] tracking-widest text-[#2a2f42] hover:text-[#525875]
                     w-full text-left px-2 py-1 rounded-[2px] bg-transparent border-none
                     cursor-pointer transition-colors uppercase">
          + Adicionar OS
        </button>
      </div>
    </div>
  )
}

//Card

function KanbanCard({
  os, isOverlay = false, justDropped = false, onClick,
}: {
  os: OS; isOverlay?: boolean; justDropped?: boolean; onClick?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: os.id })
  const valor = os.valor_final ?? os.valor_estimado

  return (
    <div ref={setNodeRef}
      aria-label={`OS de ${os.cliente_nome}, ${os.veiculo_modelo}, placa ${os.veiculo_placa}. Espaço para mover, Enter para detalhes.`}
      aria-grabbed={isDragging}
      className={justDropped ? 'card-enter' : undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'opacity 200ms ease', 'box-shadow 150ms ease'].filter(Boolean).join(', '),
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        outline: 'none',
        background: isOverlay ? '#0d1828' : '#13151c',
        border: `1px solid ${isOverlay ? '#00e5d4' : os.prazo_vencido ? 'rgba(255,61,90,0.5)' : os.alerta_parada ? 'rgba(255,61,90,0.25)' : '#1a1e2e'}`,
        borderRadius: 4, padding: '10px 11px',
        scale: isOverlay ? '1.02' : '1',
        boxShadow: isOverlay ? '0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px #00e5d4' : 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #00e5d4' }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = isOverlay ? '0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px #00e5d4' : 'none' }}
      onKeyDown={(e) => { if (e.key === 'Enter' && onClick) onClick() }}
      onClick={() => { if (!isDragging && onClick) onClick() }}
      {...attributes} {...listeners}>

      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[8px] tracking-widest text-[#525875]">
          OS-{String(os.id).padStart(3, '0')}
        </span>
        <div className="flex items-center gap-1">
          {os.prazo_vencido && (
            <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-[2px]"
              style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.3)' }}>
              vencido
            </span>
          )}
          {os.alerta_parada && (
            <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-[2px]"
              style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)' }}>
              <span aria-hidden className="w-1 h-1 rounded-full bg-[#ff3d5a] flex-shrink-0" />
              +{os.dias_na_etapa}d
            </span>
          )}
        </div>
      </div>

      <p className="font-mono text-[12px] font-bold text-[#e8ecf5] mb-0.5 truncate">{os.cliente_nome}</p>
      <p className="font-mono text-[9px] text-[#525875] mb-2">{os.veiculo_modelo} {os.veiculo_ano}</p>
      <div className="h-px bg-[#1a1e2e] mb-2" />
      <p className="font-mono text-[8px] tracking-widest text-[#2a2f42] uppercase mb-1">Serviço</p>
      <p className="font-mono text-[10px] text-[#8890a8] mb-2.5 truncate">{os.descricao_servico}</p>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-[2px]"
          style={{ color: '#525875', background: '#0a0c12', border: '1px solid #1a1e2e' }}>
          {os.veiculo_placa}
        </span>
        <span className="font-mono text-[11px] font-bold" style={{ color: valor ? '#00e5a0' : '#525875' }}>
          {valor ? `R$ ${valor.toLocaleString('pt-BR')}` : 'A definir'}
        </span>
      </div>
    </div>
  )
}

// Modal Detalhe / Edição 
function OSDetailModal({ os, onClose }: { os: OS; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [tab, setTab]       = useState<'info' | 'historico'>('info')
  const [editing, setEditing] = useState(false)
  const [form, setForm]     = useState({
    descricao_servico: os.descricao_servico,
    valor_estimado:    os.valor_estimado ? String(os.valor_estimado) : '',
    valor_final:       os.valor_final    ? String(os.valor_final)    : '',
    prazo_estimado:    os.prazo_estimado ? os.prazo_estimado.slice(0, 10) : '',
    cliente_telefone:  os.cliente_telefone ?? '',
  })
  const [saveError, setSaveError] = useState('')

  const { data: historico = [], isLoading: loadingHist } = useQuery({
    queryKey: ['os-historico', os.id],
    queryFn: () => api.os.historico(os.id),
    enabled: tab === 'historico',
  })

  const update = useMutation({
    mutationFn: (body: UpdateOSBody) => api.os.update(os.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setEditing(false)
      setSaveError('')
    },
    onError: (e: Error) => setSaveError(e.message),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    update.mutate({
      descricao_servico: form.descricao_servico,
      cliente_telefone:  form.cliente_telefone,
      valor_estimado:    form.valor_estimado ? Number(form.valor_estimado) : undefined,
      valor_final:       form.valor_final    ? Number(form.valor_final)    : undefined,
      prazo_estimado:    form.prazo_estimado || undefined,
    })
  }

  const statusInfo     = KANBAN_COLUMNS.find((c) => c.id === toKanban(os.status))
  const detailInputCls = "w-full bg-[#0a0c12] border border-[#1a1e2e] rounded-[3px] px-3 py-2 font-mono text-[11px] text-[#e8ecf5] placeholder-[#525875] outline-none focus:border-[#00e5d4] transition-colors"
  const readCls        = "font-mono text-[11px] text-[#e8ecf5]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      <div className="bg-[#0a0c12] border border-[#1a1e2e] rounded-[6px] w-full max-w-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#1a1e2e] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[9px] tracking-widest text-[#525875]">
                OS-{String(os.id).padStart(3, '0')}
              </span>
              {statusInfo && (
                <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 rounded-[2px]"
                  style={{
                    color:      statusInfo.color.replace(/rgba?\((\d+),(\d+),(\d+).*/, 'rgb($1,$2,$3)'),
                    background: statusInfo.color.replace(/rgba?\((\d+),(\d+),(\d+).*/, 'rgba($1,$2,$3,0.15)'),
                    border:    `1px solid ${statusInfo.color.replace(/rgba?\((\d+),(\d+),(\d+).*/, 'rgba($1,$2,$3,0.3)')}`,
                  }}>
                  {statusInfo.label}
                </span>
              )}
              {os.alerta_parada && (
                <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 rounded-[2px]"
                  style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)' }}>
                  parada +{os.dias_na_etapa}d
                </span>
              )}
            </div>
            <p className="font-mono text-[14px] font-bold text-[#e8ecf5]">{os.cliente_nome}</p>
            <p className="font-mono text-[10px] text-[#525875]">{os.veiculo_placa} · {os.veiculo_modelo} {os.veiculo_ano}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="h-[28px] px-3 font-mono text-[9px] tracking-widest uppercase rounded-[3px] cursor-pointer transition-colors"
                style={{ background: '#13151c', color: '#8890a8', border: '1px solid #1a1e2e' }}>
                Editar
              </button>
            )}
            <button onClick={onClose}
              className="font-mono text-[14px] text-[#525875] hover:text-[#e8ecf5] bg-transparent border-none cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1e2e] flex-shrink-0">
          {(['info', 'historico'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2.5 font-mono text-[9px] tracking-widest uppercase border-b-2 transition-colors cursor-pointer bg-transparent"
              style={{
                borderColor: tab === t ? '#00e5d4' : 'transparent',
                color:       tab === t ? '#00e5d4' : '#525875',
              }}>
              {t === 'info' ? 'Informações' : 'Histórico'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'info' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Entrada" value={fmtDate(os.data_entrada)} />
                <InfoRow label="Telefone">
                  {editing
                    ? <input className={detailInputCls} value={form.cliente_telefone} onChange={set('cliente_telefone')} placeholder="(63) 99999-0000" />
                    : <span className={readCls}>{os.cliente_telefone || '—'}</span>}
                </InfoRow>
              </div>

              <InfoRow label="Prazo estimado">
                {editing
                  ? <input className={detailInputCls} type="date" value={form.prazo_estimado} onChange={set('prazo_estimado')} />
                  : <span className={readCls} style={{ color: os.prazo_vencido ? '#ff3d5a' : '#e8ecf5' }}>
                      {fmtDate(os.prazo_estimado)}
                      {os.prazo_vencido && ' ⚠ vencido'}
                    </span>}
              </InfoRow>

              <InfoRow label="Descrição do serviço">
                {editing
                  ? <textarea className={`${detailInputCls} resize-none`} rows={3}
                      value={form.descricao_servico} onChange={set('descricao_servico')} />
                  : <span className={readCls}>{os.descricao_servico}</span>}
              </InfoRow>

              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Valor estimado">
                  {editing
                    ? <input className={detailInputCls} type="number" value={form.valor_estimado} onChange={set('valor_estimado')} placeholder="0" />
                    : <span className="font-mono text-[11px]" style={{ color: os.valor_estimado ? '#00e5a0' : '#525875' }}>
                        {os.valor_estimado ? `R$ ${os.valor_estimado.toLocaleString('pt-BR')}` : '—'}
                      </span>}
                </InfoRow>
                <InfoRow label="Valor final">
                  {editing
                    ? <input className={detailInputCls} type="number" value={form.valor_final} onChange={set('valor_final')} placeholder="0" />
                    : <span className="font-mono text-[11px] font-bold" style={{ color: os.valor_final ? '#00e5d4' : '#525875' }}>
                        {os.valor_final ? `R$ ${os.valor_final.toLocaleString('pt-BR')}` : '—'}
                      </span>}
                </InfoRow>
              </div>

              {saveError && (
                <p className="font-mono text-[10px] text-[#ff3d5a] tracking-widest">{saveError}</p>
              )}

              {editing && (
                <div className="flex gap-2 justify-end pt-2 border-t border-[#1a1e2e]">
                  <button onClick={() => { setEditing(false); setSaveError('') }}
                    className="h-[30px] px-4 font-mono text-[9px] tracking-widest uppercase rounded-[3px] cursor-pointer"
                    style={{ background: 'transparent', color: '#525875', border: '1px solid #1a1e2e' }}>
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={update.isPending}
                    className="h-[30px] px-4 font-mono text-[9px] tracking-widest uppercase rounded-[3px] cursor-pointer font-bold"
                    style={{ background: '#00e5d4', color: '#0a0c12', border: 'none', opacity: update.isPending ? 0.6 : 1 }}>
                    {update.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'historico' && (
            <div className="flex flex-col gap-2">
              {loadingHist ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-[3px] bg-[#13151c] animate-pulse" />
                  ))}
                </div>
              ) : historico.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <span className="font-mono text-[10px] text-[#525875] tracking-widest">Nenhum histórico registrado</span>
                </div>
              ) : historico.map((h) => (
                <HistoricoItem key={h.id} h={h} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HistoricoItem({ h }: { h: HistoricoOS }) {
  const anterior = h.status_anterior ? KANBAN_COLUMNS.find((c) => c.id === toKanban(h.status_anterior!))?.label ?? h.status_anterior : null
  const novo     = KANBAN_COLUMNS.find((c) => c.id === toKanban(h.status_novo))?.label ?? h.status_novo
  const data     = new Date(h.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] bg-[#13151c] border border-[#1a1e2e]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {anterior ? (
          <>
            <span className="font-mono text-[9px] text-[#525875] truncate">{anterior}</span>
            <span className="font-mono text-[9px] text-[#2a2f42] flex-shrink-0">→</span>
          </>
        ) : (
          <span className="font-mono text-[9px] text-[#525875] flex-shrink-0">criada em</span>
        )}
        <span className="font-mono text-[9px] font-bold text-[#00e5d4] truncate">{novo}</span>
      </div>
      <span className="font-mono text-[8px] text-[#2a2f42] flex-shrink-0">{data}</span>
    </div>
  )
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[8px] tracking-widest text-[#2a2f42] uppercase mb-1.5">{label}</p>
      {children ?? <span className="font-mono text-[11px] text-[#e8ecf5]">{value ?? '—'}</span>}
    </div>
  )
}

// Modal Nova OS 

function NovaOSModal({ defaultStatus, onClose }: { defaultStatus: OSStatus; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    cliente_nome: '', cliente_telefone: '',
    veiculo_placa: '', veiculo_modelo: '', veiculo_ano: String(new Date().getFullYear()),
    descricao_servico: '', valor_estimado: '', prazo_estimado: '',
  })
  const [error, setError] = useState('')

  const criar = useMutation({
    mutationFn: () => api.os.create({
      cliente_nome:      form.cliente_nome,
      cliente_telefone:  form.cliente_telefone,
      veiculo_placa:     form.veiculo_placa.toUpperCase(),
      veiculo_modelo:    form.veiculo_modelo,
      veiculo_ano:       Number(form.veiculo_ano),
      descricao_servico: form.descricao_servico,
      valor_estimado:    form.valor_estimado ? Number(form.valor_estimado) : undefined,
      prazo_estimado:    form.prazo_estimado || undefined,
    }),
    onSuccess: async (nova) => {
      if (defaultStatus !== 'orcamento') {
        await api.os.updateStatus(nova.id, STATUS_MAP_REVERSE[defaultStatus])
      }
      queryClient.invalidateQueries({ queryKey: ['os'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const required  = ['cliente_nome', 'veiculo_placa', 'veiculo_modelo', 'descricao_servico'] as const
  const canSubmit = required.every((k) => form[k].trim())
  const colName   = KANBAN_COLUMNS.find((c) => c.id === defaultStatus)?.label ?? defaultStatus

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      <div className="bg-[#0a0c12] border border-[#1a1e2e] rounded-[6px] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1e2e]">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-[#e8ecf5] uppercase">Nova Ordem de Serviço</p>
            <p className="font-mono text-[9px] text-[#525875] mt-0.5">Coluna: {colName}</p>
          </div>
          <button onClick={onClose} className="font-mono text-[14px] text-[#525875] hover:text-[#e8ecf5] bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <Section label="Cliente">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *"><input className={inputCls} placeholder="João da Silva" value={form.cliente_nome} onChange={set('cliente_nome')} /></Field>
              <Field label="Telefone"><input className={inputCls} placeholder="(63) 99999-0000" value={form.cliente_telefone} onChange={set('cliente_telefone')} /></Field>
            </div>
          </Section>
          <Section label="Veículo">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Placa *"><input className={inputCls} placeholder="ABC-1234" value={form.veiculo_placa} onChange={set('veiculo_placa')} maxLength={8} /></Field>
              <Field label="Modelo *"><input className={inputCls} placeholder="Toyota Corolla" value={form.veiculo_modelo} onChange={set('veiculo_modelo')} /></Field>
              <Field label="Ano"><input className={inputCls} type="number" value={form.veiculo_ano} onChange={set('veiculo_ano')} /></Field>
            </div>
          </Section>
          <Section label="Serviço">
            <Field label="Descrição *">
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Descreva o serviço..." value={form.descricao_servico} onChange={set('descricao_servico')} />
            </Field>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Valor estimado (R$)"><input className={inputCls} type="number" placeholder="1500" value={form.valor_estimado} onChange={set('valor_estimado')} /></Field>
              <Field label="Prazo estimado"><input className={inputCls} type="date" value={form.prazo_estimado} onChange={set('prazo_estimado')} /></Field>
            </div>
          </Section>

          {error && <p className="font-mono text-[10px] text-[#ff3d5a] tracking-widest">{error}</p>}

          <div className="flex gap-2 justify-end pt-2 border-t border-[#1a1e2e]">
            <button onClick={onClose}
              className="h-[32px] px-4 font-mono text-[9px] tracking-widest uppercase rounded-[3px] cursor-pointer"
              style={{ background: 'transparent', color: '#525875', border: '1px solid #1a1e2e' }}>
              Cancelar
            </button>
            <button onClick={() => criar.mutate()} disabled={!canSubmit || criar.isPending}
              className="h-[32px] px-4 font-mono text-[9px] tracking-widest uppercase rounded-[3px] cursor-pointer font-bold"
              style={{ background: canSubmit ? '#00e5d4' : '#13151c', color: canSubmit ? '#0a0c12' : '#525875', border: 'none', opacity: criar.isPending ? 0.6 : 1 }}>
              {criar.isPending ? 'Criando...' : 'Criar OS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}