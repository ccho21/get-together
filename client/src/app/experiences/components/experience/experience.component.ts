import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss'],
})
export class ExperienceComponent implements OnInit {
  @Input() experience?: any;
  constructor() {}

  ngOnInit(): void {
    console.log('### experience', this.experience);
  }
}
