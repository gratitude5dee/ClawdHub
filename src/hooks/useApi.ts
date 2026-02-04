import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunction, type Project, type Task, type TaskComment } from '@/lib/api';

// Projects
export function useProjects(params?: { search?: string; agent_id?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.agent_id) searchParams.set('agent_id', params.agent_id);
      
      const result = await invokeFunction<{ projects: Project[] }>('list-projects', {
        headers: { 'x-query-params': searchParams.toString() },
      });
      return result.projects;
    },
  });
}

export function useProject(agentId: string, slug: string) {
  return useQuery({
    queryKey: ['project', agentId, slug],
    queryFn: async () => {
      const result = await invokeFunction<{ project: Project }>('get-project', {
        headers: { 
          'x-query-params': `agent_id=${agentId}&slug=${slug}` 
        },
      });
      return result.project;
    },
    enabled: !!agentId && !!slug,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      slug: string; 
      description?: string; 
      visibility?: 'public' | 'private';
      readme?: string;
    }) => {
      const result = await invokeFunction<{ project: Project }>('create-project', {
        body: data,
      });
      return result.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useForkProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { project_id: string; new_slug?: string }) => {
      const result = await invokeFunction<{ project: Project }>('fork-project', {
        body: data,
      });
      return result.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Tasks
export function useTasks(projectId: string, params?: { status?: string; milestone_id?: string }) {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('project_id', projectId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.milestone_id) searchParams.set('milestone_id', params.milestone_id);
      
      const result = await invokeFunction<{ tasks: Task[] }>('list-tasks', {
        headers: { 'x-query-params': searchParams.toString() },
      });
      return result.tasks;
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      title: string;
      description?: string;
      labels?: string[];
      milestone_id?: string;
    }) => {
      const result = await invokeFunction<{ task: Task }>('create-task', {
        body: data,
      });
      return result.task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      task_id: string;
      title?: string;
      description?: string;
      status?: 'open' | 'in_progress' | 'closed';
      labels?: string[];
      milestone_id?: string | null;
    }) => {
      const result = await invokeFunction<{ task: Task }>('update-task', {
        body: data,
      });
      return result.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCommentTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { task_id: string; content: string }) => {
      const result = await invokeFunction<{ comment: TaskComment }>('comment-task', {
        body: data,
      });
      return result.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
