import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/task.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Task } from 'src/app/models/task.model';
import { List } from 'src/app/models/list.model';
import { AuthService } from 'src/app/auth.service';
import { WebRequestService } from 'src/app/web-request.service';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  searchText: string;
  searchTextTarea: string;
  lists: List[];
  tasks: Task[];

  selectedListId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router, private __authService: AuthService, private __webService: WebRequestService) { }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        if (params.listId) {
          this.selectedListId = params.listId;
          this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
          })
        } else {
          this.tasks = undefined;
        }
      }
    )

    this.taskService.getLists().subscribe((lists: List[]) => {
      this.lists = lists;
    })

  }

  onTaskClick(task: Task) {
    // we want to set the task to completed
    this.taskService.complete(task).subscribe(() => {
      // the task has been set to completed successfully
      console.log("Completed successully!");
      task.completed = !task.completed;
    })
  }

  onDeleteListClick() {
    this.taskService.deleteList(this.selectedListId).subscribe((res: any) => {
      this.router.navigate(['/lists']);
      console.log(res);
    })
  }

  onLogout() {
    this.__authService.logout().subscribe((res: any) => {
      console.log(res)
    })
  }

  onDeleteTaskClick(id: string) {
    this.taskService.deleteTask(this.selectedListId, id).subscribe((res: any) => {
      this.tasks = this.tasks.filter(val => val._id !== id);
      console.log(res);
    })
  }

  onListSortByCreationOldest() {
    this.taskService.getSortedByDateListOldest().subscribe((lists: List[]) => {
      this.lists = lists
    })
  }

  onListSortByCreationNewest() {
    this.taskService.getSortedByDateListNewest().subscribe((lists: List[]) => {
      this.lists = lists
    })
  }

  onListSortByAlphaAB() {
    this.taskService.getSortedByDateListAlpha1().subscribe((lists: List[]) => {
      this.lists = lists
    })
  }

  onTaskSortByCreationOldest() {
    this.route.params.subscribe(
      (params: Params) => {
        if (params.listId) {
          this.selectedListId = params.listId;
          this.taskService.getSortedByDateTaskOldest(params.listId).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
          })
        } else {
          this.tasks = undefined;
        }
      }
    )
  }

  onTaskSortByCreationNewest() {
    this.route.params.subscribe(
      (params: Params) => {
        if (params.listId) {
          this.selectedListId = params.listId;
          this.taskService.getSortedByDateTaskNewest(params.listId).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
          })
        } else {
          this.tasks = undefined;
        }
      }
    )
  }

  onTaskSortByAlphaAB() {
    this.route.params.subscribe(
      (params: Params) => {
        if (params.listId) {
          this.selectedListId = params.listId;
          this.taskService.getSortedByDateTaskAlpha1(params.listId).subscribe((tasks: Task[]) => {
            this.tasks = tasks;
          })
        } else {
          this.tasks = undefined;
        }
      }
    )
  }

}
