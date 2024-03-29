import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, Subscription } from 'rxjs';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
} from '@angular/router';
import { Message } from 'src/app/_models/message';
import { Pagination } from 'src/app/_models/pagination';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { MessageService } from 'src/app/_services/message.service';
import { AccountService } from 'src/app/_services/account.service';
import { MemberService } from 'src/app/_services/member.service';
import { ConfirmService } from 'src/app/_services/confirm.service';
import { PresenceService } from 'src/app/_services/presence.service';
import { UserParams } from 'src/app/_models/userParams';

export interface Section {
  name: string;
  updated: Date;
}

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  messages?: Message[] = [];
  members?: Member[];
  pagination?: Pagination;
  container = 'Inbox';
  pageNumber = 1;
  pageSize = 10;
  loading = false;

  user?: User;
  userSub$?: Subscription;

  member?: Member;
  // newMessageThread$?: Subscription;
  // messageThread$?: Subscription;
  //

  columns: string[] = [
    'senderUsername',
    'recipientUsername',
    'content',
    'recentMessages',
  ];
  displayedColumns: Array<string> = [];

  //

  constructor(
    private messageService: MessageService,
    private accountService: AccountService,
    private memberService: MemberService,
    private confirmService: ConfirmService,
    private presenceService: PresenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSub$ = this.accountService.currentUser$.subscribe((user) => {
      if (user) this.user = user;
    });
  }

  openMemberDetail(member: Member) {
    console.log('### member', member);
    // this.router.navigate()
  }

  loadUsers() {
    this.loading = true;
    const userParams: Partial<UserParams> = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
    };
    console.log('## users? IN MESSAGE!!!!!!!!!!!!!!!!!', userParams);

    this.memberService
      .getUsersWithMessage(userParams)
      .pipe(
        map((res) => {
          let { result } = res;
          const updated = result?.map((member: Member) => {
            return {
              ...member,
              recentMessages: member.recentMessages,
            };
          });

          res.result = updated;
          return res;
        })
      )
      .subscribe((response) => {
        console.log('### THIS LOAD USERS RESPONSE', response);
        if (response && response.pagination) {
          this.members = response.result;
          this.pagination = response.pagination;
          if (this.pagination) {
            this.pagination.currentPage = response.pagination.currentPage - 1;
          }
          this.loading = false;
        }
      });
  }

  loadMessages() {
    this.handleColumns();

    this.loading = true;
    this.messageService
      .getMessages(this.pageNumber, this.pageSize, this.container)
      .subscribe((response) => {
        console.log('### response', response);
        if (response && response.pagination) {
          this.messages = response.result;
          this.pagination = response.pagination;
          if (this.pagination) {
            this.pagination.currentPage = response.pagination.currentPage - 1;
          }
          this.loading = false;
        }
      });
  }

  handleColumns() {
    console.log('### container', this.container);

    if (this.container === 'Outbox') {
      this.displayedColumns = this.columns.filter(
        (column) => column !== 'senderUsername'
      );
    } else {
      this.displayedColumns = this.columns.filter(
        (column) => column !== 'recipientUsername'
      );
    }
  }

  deleteMessage(id: number) {
    this.confirmService
      .confirm('Confirm delete message', 'This cannot be undone')
      .subscribe((result) => {
        if (result) {
          this.messageService.deleteMessage(id).subscribe(() => {
            this.messages?.splice(
              this.messages.findIndex((m) => m.id === id),
              1
            );
          });
        }
      });
  }

  pageChanged(event: any) {
    if (this.pageNumber !== event.page) {
      this.pageNumber = event.pageIndex + 1;
      this.pageSize = event.pageSize;
      this.loadMessages();
    }
  }

  notReadMessages(messages: Message[]) {
    return messages && messages.length
      ? messages.filter((message) => message.dateRead === null).length
      : 0;
  }

  closeMessage(e: boolean) {
    // this.messageOpen = e;
    this.member = null!;
  }

  ngOnDestroy(): void {
    this.userSub$!.unsubscribe();

    console.log('### Member message is destroyed');
  }
}
