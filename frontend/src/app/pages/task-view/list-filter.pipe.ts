import { PipeTransform, Pipe } from '@angular/core';
import { List } from '../../models/list.model';

@Pipe({
    name: 'listFilter'
})

export class ListFilterPipe implements PipeTransform {
    transform(lists: List[], searchText: string): List[] {
        if (!lists || !searchText) {
            return lists
        }

        return lists.filter(list => list.title.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) !== -1)
    }
}