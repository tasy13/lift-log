import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown, Clock3, Dumbbell, Flame, LogOut, Plus, Search, Settings2, Sparkles, Target, Trash2, TrendingUp, X } from 'lucide-react';

const API = '/api/workouts';
const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
const formatDay = (value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
function Icon({ type, size = 17 }) {
  const shared = { size, strokeWidth: 1.8 };
  if (type === 'Cardio') return <Activity {...shared} />;
  if (type === 'Mobility') return <Sparkles {...shared} />;
  return <Dumbbell {...shared} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [sessionState, setSessionState] = useState('checking');
  const [connectionProblem, setConnectionProblem] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me').then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!active) return;
      if (response.ok) {
        setUser(data.user);
        setSessionState('ready');
      } else if (response.status === 401) {
        setSessionState('signed-out');
      } else {
        setConnectionProblem(data.message || 'The app could not connect to its server.');
        setSessionState('unavailable');
      }
    }).catch(() => {
      if (!active) return;
      setConnectionProblem('The app could not reach its server. Start it from VS Code with npm run dev.');
      setSessionState('unavailable');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (sessionState !== 'ready' || !user) return undefined;
    let active = true;
    setLoading(true);
    fetch(API).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not load your workouts.');
      if (active) setWorkouts(data);
    }).catch((error) => {
      if (active) setNotice(error.message);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [sessionState, user?.id]);

  const thisWeek = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return workouts.filter((item) => new Date(item.date) >= start);
  }, [workouts]);
  const filtered = useMemo(() => workouts
    .filter((item) => filter === 'All' || item.category === filter)
    .filter((item) => item.exercise.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date)), [workouts, filter, query]);
  const minutes = thisWeek.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const days = new Set(thisWeek.map((item) => dateKey(item.date))).size;
  const volume = thisWeek.reduce((sum, item) => sum + Number(item.sets || 0) * Number(item.reps || 0) * Number(item.weight || 0), 0);
  const weeklyBars = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + i);
    return { name: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1), count: workouts.filter((w) => dateKey(w.date) === dateKey(day)).length };
  }), [workouts]);

  function handleAuthenticated(nextUser) {
    setUser(nextUser);
    setConnectionProblem('');
    setSessionState('ready');
  }

  async function saveWorkout(values) {
    const editing = Boolean(modal?.workout);
    const response = await fetch(editing ? `${API}/${modal.workout._id}` : API, {
      method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not save workout.');
    setWorkouts((current) => editing ? current.map((w) => w._id === data._id ? data : w) : [data, ...current]);
    setModal(null); setNotice(modal?.workout ? 'Workout updated' : 'Workout saved');
    window.setTimeout(() => setNotice(''), 2600);
  }

  async function removeWorkout(workout) {
    const response = await fetch(`${API}/${workout._id}`, { method: 'DELETE' });
    if (!response.ok) { setNotice('Could not delete workout'); return; }
    setWorkouts((current) => current.filter((w) => w._id !== workout._id));
    setModal(null); setNotice('Workout removed'); window.setTimeout(() => setNotice(''), 2600);
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setWorkouts([]);
    setSessionState('signed-out');
  }

  function scrollToWorkouts() {
    document.getElementById('workouts')?.scrollIntoView({ behavior: 'smooth' });
  }

  if (sessionState === 'checking') return <div className="auth-loading"><span className="brand-mark"><Activity size={20} /></span><span>Checking your session…</span></div>;
  if (sessionState !== 'ready') return <AuthPage onAuthenticated={handleAuthenticated} connectionProblem={connectionProblem} />;

  const initials = user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#home" aria-label="Lift Log home"><span className="brand-mark"><Activity size={20} strokeWidth={2.4} /></span><span>Lift Log<span className="brand-dot">.</span></span></a>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="nav-list">
        <a className="nav-item active" href="#overview"><BarChart3 size={18} /> Overview</a>
        <a className="nav-item" href="#workouts" onClick={(e) => { e.preventDefault(); document.getElementById('workouts')?.scrollIntoView({ behavior: 'smooth' }); }}><Dumbbell size={18} /> My workouts <span className="nav-count">{workouts.length}</span></a>
      </nav>
      <div className="sidebar-label sidebar-label-spaced">YOUR WEEK</div>
      <div className="week-card"><div className="week-card-title">Weekly activity <span><TrendingUp size={15} /></span></div><div className="week-count">{days}<small> / 5 days</small></div><div className="week-track"><span style={{ width: `${Math.min(days / 5 * 100, 100)}%` }} /></div><div className="week-sub">{days >= 5 ? 'Goal reached. Amazing work!' : `${5 - days} ${5 - days === 1 ? 'day' : 'days'} to reach your goal`}</div></div>
      <div className="sidebar-bottom"><div className="coach-card"><span className="coach-icon"><Sparkles size={17} /></span><strong>Keep showing up.</strong><p>Small steps add up to big changes.</p><div className="coach-dots"><i /><i /><i /><i /><i /><i /><i /></div></div><button className="profile" onClick={signOut} title="Sign out"><span className="avatar">{initials}</span><span className="profile-copy"><strong>{user.name}</strong><small>Sign out</small></span><LogOut size={16} /></button></div>
    </aside>

    <main className="main-content" id="overview">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="sync-status"><i />Synced</span><button className="icon-button settings-button" title="Settings"><Settings2 size={18} /></button><button className="icon-button mobile-signout" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button><span className="avatar top-avatar">{initials}</span></div></header>
      <div className="content-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</div><h1>Your training, <span>in rhythm.</span></h1><p className="welcome-sub">A little progress each day adds up to big results.</p></div><button className="primary-button" onClick={() => setModal({})}><Plus size={18} strokeWidth={2.4} /> Log a workout</button></section>

        <section className="stats-grid" aria-label="Weekly stats">
          <StatCard icon={<Dumbbell size={18} />} iconTone="violet" label="WORKOUTS THIS WEEK" value={String(thisWeek.length).padStart(2, '0')} detail={thisWeek.length ? 'You’re building momentum' : 'Your next session starts here'} trend="up" />
          <StatCard icon={<Clock3 size={18} />} iconTone="blue" label="TIME ACTIVE" value={`${minutes}`} unit="min" detail="Time well spent" />
          <StatCard icon={<Flame size={18} />} iconTone="orange" label="TOTAL VOLUME" value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}` : `${Math.round(volume)}`} unit={volume >= 1000 ? 't' : 'kg'} detail="Lifted this week" trend="up" />
          <StatCard icon={<CalendarDays size={18} />} iconTone="green" label="ACTIVE DAYS" value={`${days}`} unit="days" detail="Your weekly goal: 5" />
        </section>

        <section className="insights-grid">
          <div className="panel activity-panel"><div className="panel-heading"><div><div className="section-kicker">YOUR CONSISTENCY</div><h2>Weekly activity</h2></div><button className="period-select">This week <ChevronDown size={15} /></button></div><div className="chart-area"><div className="chart-y"><span>3</span><span>2</span><span>1</span><span>0</span></div><div className="chart-main"><div className="chart-gridlines"><i /><i /><i /><i /></div><div className="bars">{weeklyBars.map((bar, i) => <div className="bar-column" key={i}><div className={`bar ${bar.count ? 'has-value' : ''}`} style={{ height: `${Math.max(8, bar.count / Math.max(3, ...weeklyBars.map((b) => b.count)) * 100)}%` }} title={`${bar.count} workout${bar.count === 1 ? '' : 's'}`}><span>{bar.count || ''}</span></div><small>{bar.name}</small></div>)}</div></div></div></div>
          <div className="panel goal-panel"><div className="panel-heading"><div><div className="section-kicker">STAY ON TRACK</div><h2>Weekly goal</h2></div><span className="goal-badge"><Target size={15} /></span></div><div className="goal-ring" style={{ '--progress': `${Math.min(days / 5 * 100, 100)}%` }}><div className="ring-inner"><strong>{days}<span>/5</span></strong><small>days</small></div></div><p className="goal-message">{days >= 5 ? <><b>Goal complete!</b><br />You showed up for yourself.</> : <><b>{5 - days} more {5 - days === 1 ? 'day' : 'days'}</b><br />You’re right on your way.</>}</p></div>
        </section>

        <section className="workouts-section" id="workouts"><div className="section-title-row"><div><div className="section-kicker">THE WORK YOU PUT IN</div><h2>Recent workouts <span className="result-count">{filtered.length}</span></h2></div><button className="text-button" onClick={scrollToWorkouts}>See all <ArrowUpRight size={15} /></button></div>
          <div className="list-toolbar"><div className="filter-pills">{['All', 'Strength', 'Cardio', 'Mobility'].map((item) => <button key={item} className={`filter-pill ${filter === item ? 'selected' : ''}`} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workouts" /></label></div>
          <div className="workout-list">{loading ? <div className="empty-state">Getting your workouts ready…</div> : filtered.length ? filtered.slice(0, 6).map((workout) => <WorkoutRow key={workout._id} workout={workout} onEdit={() => setModal({ workout })} />) : <div className="empty-state"><span className="empty-icon"><Dumbbell size={20} /></span><strong>No workouts found</strong><span>Try another filter or log a new workout.</span><button className="text-button" onClick={() => setModal({})}>Log a workout <ArrowUpRight size={15} /></button></div>}</div>
        </section>
        <footer className="footer-note"><span>Made for the long game.</span><span><span className="footer-dot" /> One day at a time</span></footer>
      </div>
    </main>
    {notice && <div className="toast"><span><Check size={15} /></span>{notice}</div>}
    {modal && <WorkoutModal workout={modal.workout} onClose={() => setModal(null)} onSave={saveWorkout} onDelete={removeWorkout} />}
  </div>;
}

function AuthPage({ onAuthenticated, connectionProblem }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && form.password.length < 8) return setError('Use a password with at least 8 characters.');
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not sign in. Please try again.');
      onAuthenticated(data.user);
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the server. Start it from VS Code with npm run dev.');
    } finally { setBusy(false); }
  }

  return <main className="auth-screen"><section className="auth-aside"><div className="auth-brand"><span className="brand-mark"><Activity size={20} strokeWidth={2.4} /></span>Lift Log<span className="brand-dot">.</span></div><div className="auth-pitch"><span className="auth-kicker">YOUR TRAINING, IN RHYTHM</span><h1>Build a stronger<br /><em>you.</em></h1><p>Show up, log the work, and see how far you’ve come.</p><div className="auth-illustration"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><span className="auth-illustration-icon"><Dumbbell size={45} strokeWidth={1.5} /></span><span className="auth-spark spark-one">✳</span><span className="auth-spark spark-two">✳</span></div></div><div className="auth-aside-foot">A little progress, every day.</div></section><section className="auth-main"><div className="auth-card"><div className="auth-mobile-brand"><span className="brand-mark"><Activity size={19} /></span>Lift Log<span className="brand-dot">.</span></div><div className="auth-card-kicker">{isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</div><h2>{isRegister ? 'Create your account' : 'Sign in to Lift Log'}</h2><p className="auth-subtitle">{isRegister ? 'A fresh start. One workout at a time.' : 'Your progress is right where you left it.'}</p>{connectionProblem && <div className="auth-warning"><strong>Server connection needed</strong><span>{connectionProblem}</span></div>}<form onSubmit={submit} className="auth-form">{isRegister && <label className="auth-field"><span>Your name</span><input name="name" value={form.name} onChange={change} autoComplete="name" placeholder="e.g. Alex Morgan" required minLength="2" maxLength="50" /></label>}<label className="auth-field"><span>Email address</span><input name="email" type="email" value={form.email} onChange={change} autoComplete="email" placeholder="you@example.com" required /></label><label className="auth-field"><span>Password</span><input name="password" type="password" value={form.password} onChange={change} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} required minLength={isRegister ? 8 : undefined} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}<ArrowUpRight size={16} /></button></form><p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Lift Log?'} <button onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}> {isRegister ? 'Sign in' : 'Create an account'}</button></p><div className="auth-security"><span><Check size={13} /></span>Your workouts are private to your account.</div></div><div className="auth-main-foot">Lift Log <span>·</span> Made for the long game</div></section></main>;
}

function StatCard({ icon, iconTone, label, value, unit, detail, trend }) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${iconTone}`}>{icon}</span><span className="stat-label">{label}</span>{trend && <span className="trend-icon"><ArrowUpRight size={15} /></span>}</div><div className="stat-value">{value}<small>{unit}</small></div><div className="stat-detail">{detail}</div></div>;
}

function WorkoutRow({ workout, onEdit }) {
  const strength = workout.category === 'Strength';
  const metric = strength ? `${workout.sets} sets · ${workout.reps} reps${workout.weight ? ` · ${workout.weight} kg` : ''}` : `${workout.duration || 0} min`;
  return <article className="workout-row"><span className={`workout-type-icon ${workout.category.toLowerCase()}`}><Icon type={workout.category} size={18} /></span><div className="workout-main"><strong>{workout.exercise}</strong><div className="workout-meta"><span>{formatDay(workout.date)}</span><i /> <span>{metric}</span></div></div><span className={`category-chip ${workout.category.toLowerCase()}`}>{workout.category}</span><button className="row-action" onClick={onEdit} aria-label={`Edit ${workout.exercise}`}><ArrowDownRight size={17} /></button></article>;
}

function WorkoutModal({ workout, onClose, onSave, onDelete }) {
  const [category, setCategory] = useState(workout?.category || 'Strength');
  const [form, setForm] = useState({ exercise: workout?.exercise || '', date: workout ? dateKey(workout.date) : dateKey(new Date()), sets: workout?.sets || 3, reps: workout?.reps || 10, weight: workout?.weight || '', duration: workout?.duration || '', notes: workout?.notes || '' });
  const [error, setError] = useState('');
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    if (!form.exercise.trim()) return setError('Add an exercise name to continue.');
    try { await onSave({ ...form, category, sets: Number(form.sets) || 1, reps: Number(form.reps) || 1, weight: Number(form.weight) || 0, duration: Number(form.duration) || 0, date: new Date(`${form.date}T12:00:00`).toISOString() }); }
    catch (err) { setError(err.message); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="section-kicker">{workout ? 'UPDATE YOUR SESSION' : 'A WIN WORTH LOGGING'}</div><h2 id="modal-title">{workout ? 'Edit workout' : 'Log a workout'}</h2></div><button className="icon-button close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={submit}><label className="field-label">Workout type</label><div className="type-selector">{['Strength', 'Cardio', 'Mobility'].map((type) => <button type="button" key={type} className={`type-choice ${type.toLowerCase()} ${category === type ? 'chosen' : ''}`} onClick={() => setCategory(type)}><Icon type={type} size={16} />{type}</button>)}</div><div className="form-grid"><label className="form-field full"><span>Exercise or session name</span><input name="exercise" value={form.exercise} onChange={change} placeholder="e.g. Upper body strength" autoFocus /></label><label className="form-field"><span>Date</span><input type="date" name="date" value={form.date} onChange={change} /></label>{category === 'Strength' ? <><label className="form-field"><span>Sets</span><input type="number" min="1" name="sets" value={form.sets} onChange={change} /></label><label className="form-field"><span>Reps per set</span><input type="number" min="1" name="reps" value={form.reps} onChange={change} /></label><label className="form-field"><span>Weight <small>(kg, optional)</small></span><input type="number" min="0" step="0.5" name="weight" value={form.weight} onChange={change} placeholder="0" /></label></> : <label className="form-field"><span>Duration <small>(minutes)</small></span><input type="number" min="0" name="duration" value={form.duration} onChange={change} placeholder="30" /></label>}<label className="form-field full"><span>Notes <small>(optional)</small></span><textarea name="notes" value={form.notes} onChange={change} placeholder="How did it feel?" rows="2" /></label></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions">{workout && <button type="button" className="delete-button" onClick={() => onDelete(workout)}><Trash2 size={16} /> Delete</button>}<span className="action-spacer" /><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Check size={16} /> {workout ? 'Save changes' : 'Save workout'}</button></div></form></section></div>;
}

export default App;
