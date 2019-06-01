import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Task } from './models/task.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webReqService: WebRequestService) { }


  getLists() {
    return this.webReqService.get('lists').pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getSortedByDateListOldest() {
    return this.webReqService.get('listsDate').pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getSortedByDateListNewest() {
    return this.webReqService.get('listsDateNewest').pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getSortedByDateListAlpha1() {
    return this.webReqService.get('listsAlphaa').pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  createList(title: string) {
    // Queremos enviar una solicitud web para crear una lista.
    return this.webReqService.post('lists', { title }).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  updateList(id: string, title: string) {
    // Queremos enviar una solicitud web para actualizar una lista.
    return this.webReqService.patch(`lists/${id}`, { title }).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  updateTask(listId: string, taskId: string, title: string) {
    // Queremos enviar una solicitud web para actualizar una tarea.
    return this.webReqService.patch(`lists/${listId}/tasks/${taskId}`, { title }).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  deleteTask(listId: string, taskId: string) {
    return this.webReqService.delete(`lists/${listId}/tasks/${taskId}`).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  deleteList(id: string) {
    return this.webReqService.delete(`lists/${id}`).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getTasks(listId: string) {
    return this.webReqService.get(`lists/${listId}/tasks`).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getSortedByDateTaskOldest(listId: string) {
    return this.webReqService.get(`lists/${listId}/tasksDate`).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getSortedByDateTaskNewest(listId: string) {
    return this.webReqService.get(`lists/${listId}/tasksNewest`).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  getSortedByDateTaskAlpha1(listId: string) {
    return this.webReqService.get(`lists/${listId}/tasksAlphaa`).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  createTask(title: string, listId: string) {
    // Queremos enviar una solicitud web para crear una tarea.
    return this.webReqService.post(`lists/${listId}/tasks`, { title }).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  complete(task: Task) {
    return this.webReqService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    }).pipe(
      catchError(this.handleError(`get_order_calendar`))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
