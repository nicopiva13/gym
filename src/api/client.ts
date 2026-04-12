const BASE_URL = import.meta.env.VITE_API_URL || 'http://76.13.163.126:8082/api';

async function request(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('gym_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
        let loginPath = '/usuario/login';
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                if (payload.role === 'trainer') loginPath = '/trainer/login';
                else if (payload.role === 'owner') loginPath = '/admin/login';
            } catch (_) {}
        }
        localStorage.removeItem('gym_token');
        window.location.href = loginPath;
        throw new Error('Sesión expirada. Por favor, ingresá nuevamente.');
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || `Error ${response.status}`);
    }

    return result;
}

export const api = {
    // AUTH
    loginAdmin: (data: { username: string; password: string }) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(data) }),
    loginTrainer: (data: { username: string; password: string }) => request('/auth/trainer/login', { method: 'POST', body: JSON.stringify(data) }),
    loginClient: (data: { dni: string }) => request('/auth/client/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),

    // CLIENTS
    getClients: () => request('/clients'),
    getClient: (id: number) => request(`/clients/${id}`),
    createClient: (data: Record<string, unknown>) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
    updateClient: (id: number, data: Record<string, unknown>) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteClient: (id: number) => request(`/clients/${id}`, { method: 'DELETE' }),

    // EXERCISES
    getExercises: () => request('/exercises'),
    createExercise: (data: Record<string, string>) => request('/exercises', { method: 'POST', body: JSON.stringify(data) }),
    updateExercise: (id: number, data: Record<string, string>) => request(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteExercise: (id: number) => request(`/exercises/${id}`, { method: 'DELETE' }),

    // TRAINING PLANS
    getTrainingPlans: () => request('/training-plans'),
    createTrainingPlan: (data: Record<string, unknown>) => request('/training-plans', { method: 'POST', body: JSON.stringify(data) }),
    updateTrainingPlan: (id: number, data: Record<string, unknown>) => request(`/training-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTrainingPlan: (id: number) => request(`/training-plans/${id}`, { method: 'DELETE' }),
    assignPlan: (planId: number, data: { client_id: number }) => request(`/training-plans/${planId}/assign`, { method: 'POST', body: JSON.stringify(data) }),
    getPlanDays: (planId: number) => request(`/training-plans/${planId}/days`),
    storePlanDay: (planId: number, data: { day_of_week: number; label: string }) => request(`/training-plans/${planId}/days`, { method: 'POST', body: JSON.stringify(data) }),
    storeDayExercise: (dayId: number, data: Record<string, unknown>) => request(`/plan-days/${dayId}/exercises`, { method: 'POST', body: JSON.stringify(data) }),
    getDayExercises: (dayId: number) => request(`/plan-days/${dayId}/exercises`),
    updateDayExercise: (exId: number, data: Record<string, unknown>) => request(`/plan-day-exercises/${exId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDayExercise: (exId: number) => request(`/plan-day-exercises/${exId}`, { method: 'DELETE' }),
    reorderDayExercises: (data: { items: { id: number; sort_order: number }[] }) => request('/plan-day-exercises/reorder', { method: 'PATCH', body: JSON.stringify(data) }),
    deletePlanDay: (dayId: number) => request(`/plan-days/${dayId}`, { method: 'DELETE' }),

    // MEMBERSHIPS
    getMembershipPlans: () => request('/membership-plans'),
    createMembershipPlan: (data: Record<string, unknown>) => request('/membership-plans', { method: 'POST', body: JSON.stringify(data) }),
    updateMembershipPlan: (id: number, data: Record<string, unknown>) => request(`/membership-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMembershipPlan: (id: number) => request(`/membership-plans/${id}`, { method: 'DELETE' }),
    assignMembership: (data: Record<string, unknown>) => request('/client-memberships', { method: 'POST', body: JSON.stringify(data) }),
    getClientMembership: (clientId: number) => request(`/client-memberships/${clientId}`),

    // PAYMENTS
    getPayments: () => request('/payments'),
    createPayment: (data: Record<string, unknown>) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
    getDailySummary: (date: string) => request(`/payments/daily-summary?date=${date}`),

    // DASHBOARD
    getOwnerDashboard: () => request('/dashboard/owner'),
    getTrainerDashboard: () => request('/dashboard/trainer'),
    getDashboardStats: (params?: { range?: string; trainer_id?: number }) => {
        const q = new URLSearchParams();
        if (params?.range) q.set('range', params.range);
        if (params?.trainer_id) q.set('trainer_id', String(params.trainer_id));
        return request(`/dashboard/stats${q.toString() ? '?' + q.toString() : ''}`);
    },

    // CLIENT STATS
    getClientStats: (clientId: number) => request(`/clients/${clientId}/stats`),

    // CLIENT PORTAL
    getMyProfile: () => request('/client/me'),
    getMyPlan: () => request('/client/me/plan'),
    getMyMembership: () => request('/client/me/membership'),

    // ATTENDANCE
    getAttendances: (clientId?: number) => request(`/attendances${clientId ? `?client_id=${clientId}` : ''}`),
    createAttendance: (data: { client_id: number }) => request('/attendances', { method: 'POST', body: JSON.stringify(data) }),
    clientSelfCheckin: () => request('/attendances/self', { method: 'POST', body: JSON.stringify({}) }),

    // WEEKLY GOALS
    getWeeklyGoals: (clientId: number) => request(`/weekly-goals?client_id=${clientId}`),
    setWeeklyGoal: (data: { client_id: number; week_start: string; met_goal: number; note: string }) => request('/weekly-goals', { method: 'POST', body: JSON.stringify(data) }),

    // SETTINGS
    getSettings: () => request('/settings'),
    updateSettings: (data: Record<string, string>) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

    // STAFF
    getStaff: () => request('/staff'),
    createStaff: (data: Record<string, unknown>) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
    updateStaff: (id: number, data: Record<string, unknown>) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteStaff: (id: number) => request(`/staff/${id}`, { method: 'DELETE' }),

    // NOTIFICATIONS
    getMyNotifications: () => request('/notifications'),
    getUnreadCount: () => request('/notifications/unread-count'),
    sendNotification: (data: { recipient_id: number; title: string; message: string; type?: string }) => request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
    sendBulkNotification: (data: { recipient_ids: number[]; title: string; message: string; type?: string }) => request('/notifications/send-bulk', { method: 'POST', body: JSON.stringify(data) }),
    markNotificationRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PUT', body: JSON.stringify({}) }),
    markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT', body: JSON.stringify({}) }),
    getAdminNotifications: () => request('/admin/notifications'),

    // COMPLAINTS
    submitComplaint: (data: { subject: string; message: string }) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
    getComplaints: () => request('/complaints'),
    updateComplaint: (id: number, data: { status: string; admin_notes?: string }) => request(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getMyComplaints: () => request('/complaints/my'),
};
