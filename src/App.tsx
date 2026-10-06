import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDownToLine, Check, ChevronDown, DoorOpen, Download,
  FileUp, Flame, Globe2, Info, MapPin, RotateCcw, ShieldCheck, SlidersHorizontal,
  Waypoints, X,
} from 'lucide-react';

type NodeType = 'room' | 'junction' | 'exit';
type BuildingNode = { id: string; label: string; type: NodeType; x: number; y: number };
type BuildingEdge = { id: string; from: string; to: string; cost: number };
type BuildingData = {
  building: string;
  nodes: BuildingNode[];
  edges: BuildingEdge[];
  initial_state: { blocked_nodes: string[]; blocked_edges: string[]; closed_exits: string[] };
};
type HazardState = BuildingData['initial_state'];
type Route = { path: string[]; exit: string; cost: number } | null;
type Language = 'en' | 'bn';

const sample: BuildingData = {
  building: 'East Annex - Practice Building',
  nodes: [
    { id: 'R1', label: 'Room 101', type: 'room', x: 60, y: 65 },
    { id: 'R2', label: 'Room 102', type: 'room', x: 60, y: 185 },
    { id: 'C1', label: 'Junction A', type: 'junction', x: 190, y: 65 },
    { id: 'C2', label: 'Junction B', type: 'junction', x: 325, y: 65 },
    { id: 'C3', label: 'Junction C', type: 'junction', x: 190, y: 185 },
    { id: 'C4', label: 'Junction D', type: 'junction', x: 325, y: 185 },
    { id: 'E1', label: 'North Exit', type: 'exit', x: 445, y: 65 },
    { id: 'E2', label: 'South Exit', type: 'exit', x: 445, y: 185 },
  ],
  edges: [
    { id: 'L01', from: 'R1', to: 'C1', cost: 2 },
    { id: 'L02', from: 'C1', to: 'C2', cost: 3 },
    { id: 'L03', from: 'C2', to: 'E1', cost: 2 },
    { id: 'L04', from: 'R1', to: 'R2', cost: 4 },
    { id: 'L05', from: 'R2', to: 'C3', cost: 2 },
    { id: 'L06', from: 'C3', to: 'C4', cost: 3 },
    { id: 'L07', from: 'C4', to: 'E2', cost: 2 },
    { id: 'L08', from: 'C1', to: 'C3', cost: 4 },
    { id: 'L09', from: 'C2', to: 'C4', cost: 3 },
  ],
  initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] },
};

const text = {
  en: {
    eyebrow: 'EMERGENCY ROUTE PLANNER', title: 'Smart Escape', subtitle: 'Live evacuation simulator',
    building: 'BUILDING', map: 'Route map', live: 'LIVE SIMULATION', start: 'Starting location',
    choose: 'Choose a starting point', route: 'Recommended route', clear: 'CLEAR ROUTE',
    noRoute: 'No route available', blockedStart: 'Starting location blocked', selectStart: 'Select a room or junction to begin.',
    noRouteHint: 'No open exit can be reached from this location.', blockedHint: 'Unblock this location or select another start.',
    block: 'Hazard controls', nodes: 'LOCATIONS', corridors: 'CORRIDORS', exits: 'EXITS',
    open: 'Open', blocked: 'Blocked', closed: 'Closed', reset: 'Reset conditions', import: 'Import building',
    legend: 'MAP KEY', room: 'Room', junction: 'Junction', exit: 'Open exit', routeLine: 'Recommended route',
    disclaimer: 'Educational simulation only. Not for real-world evacuation planning.',
    importError: 'Could not load building', imported: 'Building loaded', locale: 'বাংলা', download: 'Download sample JSON',
    cost: 'TOTAL COST', destination: 'DESTINATION', distance: 'DISTANCE', units: 'units', controlRoom: 'CONTROL ROOM', simulationMode: 'SIMULATION MODE', corridorsCount: 'corridors', active: 'Active', unavailable: 'Unavailable',
    mapHint: 'Select a room or junction to set your starting point. Select a corridor to block or reopen it.',
    resetDone: 'Conditions restored to the imported initial state.', current: 'CURRENT CONDITIONS',
  },
  bn: {
    eyebrow: 'জরুরি রুট পরিকল্পনা', title: 'স্মার্ট এস্কেপ', subtitle: 'লাইভ উচ্ছেদ সিমুলেটর',
    building: 'ভবন', map: 'রুট মানচিত্র', live: 'লাইভ সিমুলেশন', start: 'শুরুর স্থান',
    choose: 'শুরুর স্থান নির্বাচন করুন', route: 'প্রস্তাবিত রুট', clear: 'পরিষ্কার রুট',
    noRoute: 'কোনো রুট নেই', blockedStart: 'শুরুর স্থান বন্ধ', selectStart: 'শুরু করতে একটি কক্ষ বা সংযোগস্থল নির্বাচন করুন।',
    noRouteHint: 'এই স্থান থেকে কোনো খোলা নির্গমনপথে পৌঁছানো যাচ্ছে না।', blockedHint: 'স্থানটি খুলুন অথবা অন্য শুরুর স্থান নির্বাচন করুন।',
    block: 'বিপদ নিয়ন্ত্রণ', nodes: 'স্থানসমূহ', corridors: 'করিডর', exits: 'নির্গমনপথ',
    open: 'খোলা', blocked: 'বন্ধ', closed: 'বন্ধ', reset: 'অবস্থা রিসেট', import: 'ভবনের ফাইল আনুন',
    legend: 'মানচিত্র নির্দেশিকা', room: 'কক্ষ', junction: 'সংযোগস্থল', exit: 'খোলা নির্গমনপথ', routeLine: 'প্রস্তাবিত রুট',
    disclaimer: 'শুধু শিক্ষামূলক সিমুলেশন। বাস্তব জরুরি পরিকল্পনার জন্য নয়।',
    importError: 'ভবন লোড করা যায়নি', imported: 'ভবন লোড হয়েছে', locale: 'English', download: 'নমুনা JSON ডাউনলোড',
    cost: 'মোট খরচ', corridorsCount: 'করিডর', active: 'সক্রিয়', unavailable: 'অকার্যকর',
    mapHint: 'শুরুর স্থান নির্ধারণে একটি কক্ষ বা সংযোগস্থল বাছুন। করিডর বন্ধ বা খুলতে সেটিতে ক্লিক করুন।',
    resetDone: 'আমদানি করা প্রাথমিক অবস্থায় ফিরিয়ে আনা হয়েছে।', current: 'বর্তমান অবস্থা', destination: 'গন্তব্য', distance: 'দূরত্ব', units: 'একক', controlRoom: 'নিয়ন্ত্রণ কক্ষ', simulationMode: 'সিমুলেশন মোড',
  },
} satisfies Record<Language, Record<string, string>>;

function validateBuilding(value: unknown): BuildingData {
  if (!value || typeof value !== 'object') throw new Error('JSON root must be an object.');
  const data = value as Record<string, unknown>;
  if (typeof data.building !== 'string' || !data.building.trim()) throw new Error('building must be a non-empty string.');
  if (!Array.isArray(data.nodes) || data.nodes.length < 2 || data.nodes.length > 60) throw new Error('nodes must contain 2–60 entries.');
  if (!Array.isArray(data.edges) || data.edges.length < 1 || data.edges.length > 150) throw new Error('edges must contain 1–150 entries.');
  const ids = new Set<string>();
  const nodes = data.nodes.map((node, index) => {
    if (!node || typeof node !== 'object') throw new Error(`nodes[${index}] must be an object.`);
    const item = node as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error(`nodes[${index}] has a missing or duplicate id.`);
    if (typeof item.label !== 'string' || !item.label.trim()) throw new Error(`Node ${item.id} needs a label.`);
    if (!['room', 'junction', 'exit'].includes(String(item.type))) throw new Error(`Node ${item.id} has an invalid type.`);
    if (typeof item.x !== 'number' || !Number.isFinite(item.x) || typeof item.y !== 'number' || !Number.isFinite(item.y)) throw new Error(`Node ${item.id} needs numeric coordinates.`);
    ids.add(item.id);
    return item as unknown as BuildingNode;
  });
  if (!nodes.some((node) => node.type !== 'exit') || !nodes.some((node) => node.type === 'exit')) throw new Error('At least one room/junction and one exit are required.');
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeIds = new Set<string>();
  const pairs = new Set<string>();
  const edges = data.edges.map((edge, index) => {
    if (!edge || typeof edge !== 'object') throw new Error(`edges[${index}] must be an object.`);
    const item = edge as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id || edgeIds.has(item.id)) throw new Error(`edges[${index}] has a missing or duplicate id.`);
    if (typeof item.from !== 'string' || typeof item.to !== 'string' || !nodeById.has(item.from) || !nodeById.has(item.to)) throw new Error(`Edge ${item.id} references an unknown node.`);
    if (item.from === item.to) throw new Error(`Edge ${item.id} cannot be a self-loop.`);
    if (!Number.isInteger(item.cost) || (item.cost as number) <= 0) throw new Error(`Edge ${item.id} cost must be a positive integer.`);
    const pair = [item.from, item.to].sort().join('\u0000');
    if (pairs.has(pair)) throw new Error(`Repeated corridor between ${item.from} and ${item.to}.`);
    pairs.add(pair);
    edgeIds.add(item.id);
    return item as unknown as BuildingEdge;
  });
  if (!data.initial_state || typeof data.initial_state !== 'object') throw new Error('initial_state is required.');
  const initial = data.initial_state as Record<string, unknown>;
  for (const field of ['blocked_nodes', 'blocked_edges', 'closed_exits'] as const) {
    if (!Array.isArray(initial[field]) || !(initial[field] as unknown[]).every((id) => typeof id === 'string')) throw new Error(`initial_state.${field} must be an array of IDs.`);
    if (new Set(initial[field] as string[]).size !== (initial[field] as string[]).length) throw new Error(`initial_state.${field} cannot contain duplicates.`);
  }
  const blockedNodes = initial.blocked_nodes as string[];
  const blockedEdges = initial.blocked_edges as string[];
  const closedExits = initial.closed_exits as string[];
  if (blockedNodes.some((id) => !nodeById.has(id) || nodeById.get(id)?.type === 'exit')) throw new Error('blocked_nodes must reference rooms or junctions.');
  if (blockedEdges.some((id) => !edgeIds.has(id))) throw new Error('blocked_edges contains an unknown edge ID.');
  if (closedExits.some((id) => nodeById.get(id)?.type !== 'exit')) throw new Error('closed_exits must reference exit IDs.');
  return { building: data.building, nodes, edges, initial_state: { blocked_nodes: blockedNodes, blocked_edges: blockedEdges, closed_exits: closedExits } };
}

function localizedValidationError(message: string, language: Language) {
  if (language === 'en') return message;
  if (/JSON|Unexpected token|Expected property name/i.test(message)) return 'JSON ফাইলটি পড়া যায়নি। ফাইলের JSON গঠন পরীক্ষা করুন।';
  if (/building/.test(message)) return 'building একটি খালি নয় এমন নাম হতে হবে।';
  if (/nodes|Node |At least one room/.test(message)) return 'স্থান যাচাই ব্যর্থ। ২–৬০টি বৈধ স্থান, অনন্য আইডি, লেবেল, ধরন ও সংখ্যাসূচক স্থানাঙ্ক দিন; অন্তত একটি কক্ষ/সংযোগস্থল এবং একটি নির্গমনপথ থাকতে হবে।';
  if (/edges|Edge |Repeated corridor/.test(message)) return 'করিডর যাচাই ব্যর্থ। ১–১৫০টি বৈধ, অনন্য করিডর দিন; প্রতিটি করিডরের পরিচিত স্থান, পৃথক প্রান্ত এবং ধনাত্মক পূর্ণসংখ্যার খরচ থাকতে হবে।';
  if (/initial_state|blocked_nodes|blocked_edges|closed_exits/.test(message)) return 'প্রাথমিক অবস্থা যাচাই ব্যর্থ। বন্ধ স্থান, করিডর ও নির্গমনপথের আইডি সঠিক শ্রেণির হতে হবে।';
  return 'ভবনের ফাইলটি বৈধ নয়। স্কিমা এবং প্রয়োজনীয় ক্ষেত্রগুলো পরীক্ষা করুন।';
}

function comparePaths(a: string[], b: string[]) {
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return a.length - b.length;
}

function findRoute(building: BuildingData, start: string, hazards: HazardState): Route {
  const nodeById = new Map(building.nodes.map((node) => [node.id, node]));
  if (hazards.blocked_nodes.includes(start)) return null;
  const best = new Map<string, { cost: number; path: string[] }>([[start, { cost: 0, path: [start] }]]);
  const pending = new Set([start]);
  while (pending.size) {
    const currentId = [...pending].sort((a, b) => {
      const left = best.get(a)!; const right = best.get(b)!;
      return left.cost - right.cost || comparePaths(left.path, right.path);
    })[0];
    pending.delete(currentId);
    const current = best.get(currentId)!;
    const currentNode = nodeById.get(currentId)!;
    if (currentNode.type === 'exit') continue;
    for (const edge of building.edges) {
      if (hazards.blocked_edges.includes(edge.id)) continue;
      const nextId = edge.from === currentId ? edge.to : edge.to === currentId ? edge.from : null;
      if (!nextId || hazards.blocked_nodes.includes(nextId) || hazards.closed_exits.includes(nextId)) continue;
      const candidate = { cost: current.cost + edge.cost, path: [...current.path, nextId] };
      const previous = best.get(nextId);
      if (!previous || candidate.cost < previous.cost || (candidate.cost === previous.cost && comparePaths(candidate.path, previous.path) < 0)) {
        best.set(nextId, candidate);
        pending.add(nextId);
      }
    }
  }
  const choices = building.nodes.filter((node) => node.type === 'exit' && !hazards.closed_exits.includes(node.id))
    .map((node) => ({ node, result: best.get(node.id) }))
    .filter((entry): entry is { node: BuildingNode; result: { cost: number; path: string[] } } => Boolean(entry.result))
    .sort((a, b) => a.result.cost - b.result.cost || (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0) || comparePaths(a.result.path, b.result.path));
  return choices.length ? { path: choices[0].result.path, exit: choices[0].node.id, cost: choices[0].result.cost } : null;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function App() {
  const [building, setBuilding] = useState(sample);
  const [hazards, setHazards] = useState<HazardState>(sample.initial_state);
  const [start, setStart] = useState('R1');
  const [language, setLanguage] = useState<Language>('en');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [importName, setImportName] = useState('building.json');
  const fileRef = useRef<HTMLInputElement>(null);
  const copy = text[language];
  const route = useMemo(() => findRoute(building, start, hazards), [building, start, hazards]);
  const blockedStart = hazards.blocked_nodes.includes(start);
  const nodeById = useMemo(() => new Map(building.nodes.map((node) => [node.id, node])), [building]);
  const routeEdges = useMemo(() => new Set(building.edges.filter((edge) => route && route.path.some((id, index) => index < route.path.length - 1 && ((edge.from === id && edge.to === route.path[index + 1]) || (edge.to === id && edge.from === route.path[index + 1])))).map((edge) => edge.id)), [building, route]);
  const bounds = useMemo(() => {
    const xs = building.nodes.map((node) => node.x); const ys = building.nodes.map((node) => node.y);
    const minX = Math.min(...xs); const minY = Math.min(...ys);
    return { minX, minY, width: Math.max(1, Math.max(...xs) - minX), height: Math.max(1, Math.max(...ys) - minY) };
  }, [building]);
  const viewBox = `${bounds.minX - 85} ${bounds.minY - 78} ${bounds.width + 170} ${bounds.height + 156}`;
  const changedCount = hazards.blocked_nodes.length + hazards.blocked_edges.length + hazards.closed_exits.length;

  function setHazard(key: keyof HazardState, id: string) {
    setHazards((current) => ({ ...current, [key]: toggle(current[key], id) }));
    setNotice('');
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = validateBuilding(JSON.parse(await file.text()));
      setBuilding(parsed);
      setHazards(parsed.initial_state);
      setStart(parsed.nodes.find((node) => node.type !== 'exit')!.id);
      setImportName(file.name);
      setError('');
      setNotice(`${copy.imported}: ${parsed.building}`);
    } catch (caught) {
      setError(`${copy.importError}: ${localizedValidationError(caught instanceof Error ? caught.message : 'Invalid JSON.', language)}`);
      setNotice('');
    } finally {
      event.target.value = '';
    }
  }

  function reset() {
    setHazards({
      blocked_nodes: [...building.initial_state.blocked_nodes],
      blocked_edges: [...building.initial_state.blocked_edges],
      closed_exits: [...building.initial_state.closed_exits],
    });
    setNotice(copy.resetDone);
  }

  function downloadSample() {
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'building.json'; link.click(); URL.revokeObjectURL(url);
  }

  const nodeStatus = (node: BuildingNode) => node.type === 'exit'
    ? hazards.closed_exits.includes(node.id) ? copy.closed : copy.open
    : hazards.blocked_nodes.includes(node.id) ? copy.blocked : copy.open;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Smart Escape home"><span className="brand-mark"><Waypoints size={20} strokeWidth={2.2} /></span><span>smart<span className="brand-light">escape</span></span></a>
        <div className="top-meta"><span className="status-pulse" />{copy.live}<span className="top-divider" />{copy.eyebrow}</div>
        <div className="top-actions">
          <button className="language-button" onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')} aria-label="Switch language"><Globe2 size={15} />{copy.locale}</button>
          <button className="icon-button" title={copy.download} aria-label={copy.download} onClick={downloadSample}><Download size={17} /></button>
        </div>
      </header>

      <section className="intro-row" id="top">
        <div><div className="eyebrow"><span className="eyebrow-line" />{copy.eyebrow}</div><h1>{copy.title}<span className="title-period">.</span></h1><p className="subtitle">{copy.subtitle} <span className="slash">/</span> {building.building}</p></div>
        <button className="import-button" onClick={() => fileRef.current?.click()}><FileUp size={17} />{copy.import}<ChevronDown size={15} className="button-chevron" /></button>
        <input ref={fileRef} className="sr-only" type="file" accept="application/json,.json" onChange={importFile} />
      </section>

      <div className="workspace">
        <section className="map-panel" aria-label={copy.map}>
          <div className="panel-head">
            <div><div className="section-kicker">01 / {copy.building}</div><h2>{copy.map}</h2></div>
            <div className="map-head-actions"><span className="floor-tag"><MapPin size={13} />{building.building}</span><button className="reset-button" onClick={reset}><RotateCcw size={14} />{copy.reset}</button></div>
          </div>
          <div className="map-wrap">
            <div className="map-grid" />
            <svg className="map-svg" viewBox={viewBox} role="img" aria-label={`${copy.map}: ${building.nodes.length} locations and ${building.edges.length} corridors`}>
              <defs><pattern id="mapDots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#ccd0c8" /></pattern></defs>
              <rect x={bounds.minX - 85} y={bounds.minY - 78} width={bounds.width + 170} height={bounds.height + 156} fill="url(#mapDots)" opacity=".55" />
              {building.edges.map((edge) => {
                const from = nodeById.get(edge.from)!; const to = nodeById.get(edge.to)!;
                const blocked = hazards.blocked_edges.includes(edge.id) || hazards.blocked_nodes.includes(edge.from) || hazards.blocked_nodes.includes(edge.to);
                const selected = routeEdges.has(edge.id) && !blocked;
                const centerX = (from.x + to.x) / 2; const centerY = (from.y + to.y) / 2;
                return <g key={edge.id} className={`edge-group ${selected ? 'edge-active' : ''} ${blocked ? 'edge-blocked' : ''}`} onClick={() => setHazard('blocked_edges', edge.id)} role="button" tabIndex={0} aria-label={`${edge.from} to ${edge.to}, cost ${edge.cost}, ${hazards.blocked_edges.includes(edge.id) ? copy.blocked : copy.open}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setHazard('blocked_edges', edge.id); } }}>
                  <line className="edge-hit" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                  <line className="edge-line" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                  {selected && <line className="edge-route" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />}
                  {blocked && <g className="edge-x"><circle cx={centerX} cy={centerY} r="8" /><path d={`M${centerX - 3} ${centerY - 3}l6 6m0-6l-6 6`} /></g>}
                  <g className="cost-label" transform={`translate(${centerX}, ${centerY})`}><rect x="-13" y="-9" width="26" height="18" rx="4" /><text textAnchor="middle" dominantBaseline="central">{edge.cost}</text></g>
                </g>;
              })}
              {building.nodes.map((node) => {
                const blocked = node.type === 'exit' ? hazards.closed_exits.includes(node.id) : hazards.blocked_nodes.includes(node.id);
                const selected = start === node.id;
                const routeNode = route?.path.includes(node.id) ?? false;
                return <g key={node.id} className={`node-group node-${node.type} ${blocked ? 'node-blocked' : ''} ${selected ? 'node-selected' : ''} ${routeNode ? 'node-on-route' : ''}`} transform={`translate(${node.x}, ${node.y})`} onClick={() => node.type === 'exit' ? setHazard('closed_exits', node.id) : setStart(node.id)} role="button" tabIndex={0} aria-label={`${node.id}, ${node.label}, ${nodeStatus(node)}${node.type !== 'exit' ? `, ${copy.start}` : ''}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); node.type === 'exit' ? setHazard('closed_exits', node.id) : setStart(node.id); } }}>
                  {selected && <circle className="selection-ring" r="31" />}
                  <circle className="node-shadow" cy="3" r={node.type === 'junction' ? 18 : 20} />
                  <circle className="node-shape" r={node.type === 'junction' ? 17 : 19} />
                  {node.type === 'exit' ? <path className="exit-icon" d="M-5 -7h10v14H-5M1 0h7m-3-3 3 3-3 3" /> : node.type === 'room' ? <rect className="room-icon" x="-5.5" y="-6" width="11" height="12" rx="1" /> : <path className="junction-icon" d="M-6 0h12M0-6v12" />}
                  {blocked && <g className="node-hazard"><circle cx="14" cy="-14" r="9" /><path d="m11 -17 6 6m0-6-6 6" /></g>}
                  <text className="node-id" y="38" textAnchor="middle">{node.id}</text>
                  <text className="node-label" y="53" textAnchor="middle">{node.label}</text>
                </g>;
              })}
            </svg>
            <div className="map-compass"><span>N</span><ArrowDownToLine size={14} /></div>
            <div className="map-scale">{building.nodes.length} {copy.nodes.toLowerCase()} <span /> {building.edges.length} {copy.corridors.toLowerCase()}</div>
          </div>
          <div className="map-footer"><p><Info size={14} />{copy.mapHint}</p><div className="legend"><span><i className="legend-dot room-dot" />{copy.room}</span><span><i className="legend-dot junction-dot" />{copy.junction}</span><span><i className="legend-dot exit-dot" />{copy.exit}</span><span><i className="legend-line" />{copy.routeLine}</span></div></div>
        </section>

        <aside className="side-panel">
          <section className="route-card">
            <div className="section-kicker">02 / {copy.route}</div>
            <label className="field-label" htmlFor="start-select">{copy.start}</label>
            <div className="select-wrap"><select id="start-select" value={start} onChange={(event) => setStart(event.target.value)}>{building.nodes.filter((node) => node.type !== 'exit').map((node) => <option key={node.id} value={node.id}>{node.id} · {node.label}{hazards.blocked_nodes.includes(node.id) ? ` — ${copy.blocked}` : ''}</option>)}</select><ChevronDown size={15} /></div>
            {blockedStart ? <div className="route-state state-blocked"><div className="state-icon"><AlertTriangle size={18} /></div><div><h3>{copy.blockedStart}</h3><p>{copy.blockedHint}</p></div></div>
              : route ? <div className="route-state state-ready"><div className="state-icon"><ShieldCheck size={18} /></div><div><h3>{copy.route}</h3><p>{route.path.join('  →  ')}</p></div></div>
                : <div className="route-state state-empty"><div className="state-icon"><X size={18} /></div><div><h3>{copy.noRoute}</h3><p>{copy.noRouteHint}</p></div></div>}
            {route && !blockedStart ? <div className="route-metrics"><div><span className="metric-label">{copy.cost}</span><strong>{route.cost}<small>{copy.units}</small></strong></div><div className="metric-divider" /><div><span className="metric-label">{copy.destination}</span><strong className="destination"><DoorOpen size={17} />{route.exit}</strong></div><div className="metric-divider" /><div><span className="metric-label">{copy.distance}</span><strong>{route.path.length - 1}<small>{copy.corridorsCount}</small></strong></div></div> : <div className="route-metrics route-metrics-muted"><div><span className="metric-label">{copy.current}</span><strong>{blockedStart ? copy.blocked : copy.unavailable}</strong></div></div>}
          </section>

          <section className="hazard-panel">
            <div className="hazard-heading"><div><div className="section-kicker">03 / {copy.controlRoom}</div><h2><SlidersHorizontal size={17} />{copy.block}</h2></div><span className={`hazard-count ${changedCount ? 'has-changes' : ''}`}>{changedCount.toString().padStart(2, '0')}</span></div>
            <div className="hazard-group"><div className="group-title"><span>{copy.nodes}</span><span>{copy.active} / {copy.unavailable}</span></div>
              {building.nodes.filter((node) => node.type !== 'exit').map((node) => { const off = hazards.blocked_nodes.includes(node.id); return <button className={`hazard-row ${off ? 'is-off' : ''}`} key={node.id} onClick={() => setHazard('blocked_nodes', node.id)}><span className="row-symbol"><MapPin size={14} /></span><span className="row-name"><b>{node.id}</b><small>{node.label}</small></span><span className="row-status">{off ? copy.blocked : copy.open}</span><span className={`switch ${off ? 'switch-on' : ''}`}><i /></span></button>; })}
            </div>
            <div className="hazard-group exit-group"><div className="group-title"><span>{copy.exits}</span><span>{copy.open} / {copy.closed}</span></div>
              {building.nodes.filter((node) => node.type === 'exit').map((node) => { const off = hazards.closed_exits.includes(node.id); return <button className={`hazard-row ${off ? 'is-off' : ''}`} key={node.id} onClick={() => setHazard('closed_exits', node.id)}><span className="row-symbol exit-symbol"><DoorOpen size={14} /></span><span className="row-name"><b>{node.id}</b><small>{node.label}</small></span><span className="row-status">{off ? copy.closed : copy.open}</span><span className={`switch ${off ? 'switch-on' : ''}`}><i /></span></button>; })}
            </div>
            <div className="corridor-group"><div className="group-title"><span>{copy.corridors}</span><span>{copy.open} / {copy.blocked}</span></div><div className="corridor-list">
              {building.edges.map((edge) => { const off = hazards.blocked_edges.includes(edge.id); return <button className={`corridor-chip ${off ? 'corridor-off' : ''} ${routeEdges.has(edge.id) && !off ? 'corridor-route' : ''}`} key={edge.id} onClick={() => setHazard('blocked_edges', edge.id)} title={`${edge.from} ↔ ${edge.to}: ${edge.cost}`}><span>{edge.from}<i />{edge.to}</span><b>{edge.cost}</b>{off && <X size={11} />}</button>; })}
            </div></div>
          </section>
          <div className="file-card"><span className="file-icon"><Check size={15} /></span><div><b>{importName}</b><small>{copy.imported} · {building.nodes.length} {copy.nodes.toLowerCase()}</small></div><button title={copy.import} aria-label={copy.import} onClick={() => fileRef.current?.click()}><FileUp size={15} /></button></div>
        </aside>
      </div>

      {(notice || error) && <div className={`toast ${error ? 'toast-error' : ''}`} role={error ? 'alert' : 'status'}>{error ? <AlertTriangle size={15} /> : <Check size={15} />}{error || notice}<button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss"><X size={14} /></button></div>}
      <footer className="footer"><span><Flame size={14} />{copy.disclaimer}</span><span className="footer-right"><span className="footer-dot" />{copy.simulationMode} <i /> v1.0</span></footer>
    </main>
  );
}

export { comparePaths, findRoute, validateBuilding };
export default App;