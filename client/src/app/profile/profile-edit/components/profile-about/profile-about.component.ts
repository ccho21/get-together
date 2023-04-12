import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MemberService } from 'src/app/_services/member.service';
import { take } from 'rxjs/operators';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Photo } from 'src/app/_models/photo';

@Component({
  selector: 'app-profile-about',
  templateUrl: './profile-about.component.html',
  styleUrls: ['./profile-about.component.scss'],
})
export class ProfileAboutComponent implements OnInit {
  // @ViewChild('editForm') editForm?: NgForm;

  member?: Member;
  user?: User;
  activeTab?: number;

  editForm: FormGroup = this.fb.group({
    gender: ['male'],
    name: [''],
    knownAs: [''],
    dateOfBirth: [''],
    city: [''],
    country: [''],
    introduction: [''],
    lookingFor: [''],
    interests: [''],
    website: [''],
  });

  @HostListener('window:beforeunload', ['$event']) unloadNotification(
    $event: any
  ) {
    console.log('### event', $event);
    if (this.editForm?.dirty) {
      $event.returnValue = true;
    }
  }

  constructor(
    private accountService: AccountService,
    private memberService: MemberService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.accountService.currentUser$
      .pipe(take(1))
      .subscribe((user) => (this.user = user as User));
  }

  ngOnInit(): void {
    this.loadMember();
  }

  loadMember() {
    this.memberService
      .getMember(this.user?.username as string)
      .subscribe((member) => {
        this.member = member;
        this.updateForm(this.member);
      });
  }

  updateForm(member: Member) {
    const {
      interests,
      lookingFor,
      city,
      country,
      gender,
      introduction,
      knownAs,
    } = member;

    this.editForm?.patchValue({
      name: knownAs,
      interests,
      lookingFor,
      city,
      country,
      gender,
      introduction,
    });

    console.log('### this.register form', this.editForm?.value);
  }

  updateMember() {
    this.memberService.updateMember(this.member as Member).subscribe(() => {
      this._snackBar.open(`Profile updated successfully`, 'okay', {
        duration: 5000,
        verticalPosition: 'bottom',
      });
      this.editForm?.reset(this.member);
    });
  }

  setMainPhoto(photo: Photo) {
    this.memberService.setMainPhoto(photo.id).subscribe(() => {
      if (this.user && this.member) {
        this.user.photoUrl = photo.url;
        this.accountService.setCurrentUser(this.user);

        //TODO: NGRX
        this.member.photoUrl = photo.url;
        this.member.photos.forEach((p) => {
          if (p.isMain) p.isMain = false;
          if (p.id === photo.id) p.isMain = true;
        });
      }
    });
  }

  updatePhoto(photo: Photo) {
    //TODO: NGRX
    if (photo && this.user && this.member) {
      if (photo.isMain) {
        this.user.photoUrl = photo.url;
        this.member.photoUrl = photo.url;
        this.accountService.setCurrentUser(this.user);
      }
    }
  }

  deletePhoto(photoId: number) {
    this.memberService.deletePhoto(photoId).subscribe(() => {
      if (this.member) {
        //TODO: NGRX
        this.member.photos = this.member.photos.filter((x) => x.id !== photoId);
      }
    });
  }
}