import { PipeTransform, Pipe } from '@angular/core';
import { Task } from '../../models/task.model';

@Pipe({
    name: 'taskFilter'
})

export class TaskFilterPipe implements PipeTransform {
    transform(tasks: Task[], searchTextTarea: string): Task[] {
        if (!tasks || !searchTextTarea) {
            return tasks
        }

        return tasks.filter(list => list.title.toLocaleLowerCase().indexOf(searchTextTarea.toLocaleLowerCase()) !== -1)
    }
}