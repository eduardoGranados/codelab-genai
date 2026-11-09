// app.component.ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, FormsModule],
    template: `
        <section>
            <input
                type="text"
                placeholder="dog"
                [(ngModel)]="animal"
                class="text-black border-2 p-2 m-2 rounded"
            />
            <button
                (click)="getNewFunFacts()"
            >
                Get New Fun Facts
            </button>
            <ol>
                @for(fact of facts(); track fact) {
                    <li>{{fact}}</li>  
                } @empty {
                    <li>No facts are available</li>
                }
            </ol>
        </section>
    `,
    styles: '',
})
export class AppComponent {
    animal = '';
    facts = signal<string[]>([]);

    getNewFunFacts() {
        fetch(`/api/facts?animal=${this.animal}`).then(response => response.json()).then(facts => {
            this.facts.set(facts);
        });
    }
}