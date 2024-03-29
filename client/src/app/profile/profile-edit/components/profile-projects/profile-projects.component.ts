import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Member } from 'src/app/_models/member';
import { Pagination } from 'src/app/_models/pagination';
import { Project } from 'src/app/_models/project';
import { ProjectParams } from 'src/app/_models/projectParams';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { ProjectService } from 'src/app/_services/project.service';

@Component({
  selector: 'app-profile-projects',
  templateUrl: './profile-projects.component.html',
  styleUrls: ['./profile-projects.component.scss'],
})
export class ProfileProjectsComponent implements OnInit, OnDestroy {
  projects?: Project[];
  pagination?: Pagination;

  user?: User;
  userSub$?: Subscription;
  btns?: Array<any>;

  @Input() member?: Member;
  loading: boolean = false;

  constructor(
    private projectService: ProjectService,
    private accountService: AccountService
  ) {
    this.userSub$ = this.accountService.currentUser$.subscribe(
      (user: User | null) => {
        if (user) {
          this.user = user;
        }
      }
    );
  }
  ngOnDestroy(): void {
    this.userSub$!.unsubscribe();
    this.projectService.resetProjectParams();
  }

  ngOnInit(): void {
    this.btns = [
      {
        btnLabel: 'Add Project',
        btnLink: '/main/dashboard/projects/create',
        customClass: '',
      },
    ];

    this.loading = true;
    const params: ProjectParams = this.projectService.getProjectParams();
    console.log('### NG ON INIT', params);

    if (this.projects) {
      this.loading = false;
    }

    this.loadProjects(params);
  }

  loadProjects(params: ProjectParams) {
    this.loading = true;
    params.currentUsername = this.user?.username || undefined;

    this.projectService.getProjects(params).subscribe({
      next: (response) => {
        if (response && response.pagination) {
          console.log('### RESPONSE', response);
          this.projects = response.result;
          this.pagination = response.pagination;
        }
        this.projectService.resetProjectParams();
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  pageChanged(params: ProjectParams): void {
    this.loadProjects(params);
  }
}
