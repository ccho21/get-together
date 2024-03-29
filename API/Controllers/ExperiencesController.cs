using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Authorize]
    public class ExperiencesController : BaseApiController
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        private readonly IPhotoService _photoService;
        private readonly IUnitOfWork _unitOfWork;
        public ExperiencesController(IUnitOfWork unitOfWork, IMapper mapper, IPhotoService photoService, DataContext context)
        {
            _unitOfWork = unitOfWork;
            _photoService = photoService;
            _mapper = mapper;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExperienceDto>>> GetExperiences([FromQuery] ExperienceParams experienceParams)
        {

            var experiences = await _unitOfWork.ExperienceRepository.GetExperiencesAsync(experienceParams);

            Response.AddPaginationHeader(experiences.CurrentPage, experiences.PageSize, experiences.TotalCount, experiences.TotalPages);

            return Ok(experiences);
        }

        [HttpGet("{id}", Name = "getExperience")]
        public async Task<ActionResult<ExperienceDto>> getExperience(int id)
        {
            return await _unitOfWork.ExperienceRepository.GetExperienceAsync(id);
        }

        private async Task<List<Skill>> getMatchingSkills(ICollection<SkillDto> skills)
        {
            var matchingSkills = new List<Skill>();
            if (skills == null)
            {
                return matchingSkills;
            }

            foreach (var skill in skills)
            {
                var existingSkill = await _context.Skills.SingleOrDefaultAsync(x => x.Name.Replace(" ", string.Empty).ToLower() == skill.Name.Replace(" ", string.Empty).ToLower());
                if (existingSkill != null)
                {
                    matchingSkills.Add(existingSkill);
                }
                else
                {
                    var newSkill = new Skill
                    {
                        Name = skill.Name
                    };

                    matchingSkills.Add(newSkill);
                }
            }
            return matchingSkills;
        }

        [HttpPost]
        public async Task<ActionResult<ExperienceDto>> CreateExperience(ExperienceDto createExperienceDto)
        {
            var username = User.GetUsername();
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);

            var experience = new Experience
            {
                Intro = createExperienceDto.Intro,
                Position = createExperienceDto.Position,
                CompanyName = createExperienceDto.CompanyName,
                Url = createExperienceDto.Url,
                IsCurrent = createExperienceDto.IsCurrent,
                Started = createExperienceDto.Started,
                Ended = createExperienceDto.Ended,
                Skills = createExperienceDto.Skills,
                AppUser = user,
                JobDescriptions = createExperienceDto.JobDescriptions.Select(x => new JobDescription
                {
                    Description = x.Description,
                    Position = x.Position,
                    IsCurrent = x.IsCurrent,
                    Started = x.Started,
                    Ended = x.Ended,
                    Details = x.Details,

                }).ToList(),
            };

            _unitOfWork.ExperienceRepository.AddExperience(experience);

            if (await _unitOfWork.Complete()) return Ok(_mapper.Map<ExperienceDto>(experience));

            return BadRequest("Failed to send message");
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ExperienceDto>> UpdateExperience(int id, ExperienceUpdateDto updateExperienceDto)
        {
            var username = User.GetUsername();
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);

            var experience = await _unitOfWork.ExperienceRepository.GetExperienceByIdAsync(id);

            if (experience == null)
                return BadRequest("Experience not found");

            if (user.Id != experience.AppUserId)
                return BadRequest("You don't have permission to update this experience");


            var matchingSkills = new List<Skill>();
            if (updateExperienceDto.Skills != null && updateExperienceDto.Skills.Count() > 0)
            {
                foreach (var skill in updateExperienceDto.Skills)
                {
                    var existingSkill = await _context.Skills.AsNoTracking().SingleOrDefaultAsync(x => x.Name.Replace(" ", string.Empty).ToLower() == skill.Name.Replace(" ", string.Empty).ToLower());
                    if (existingSkill != null)
                    {
                        matchingSkills.Add(existingSkill);
                    }
                    else
                    {
                        var newSkill = new Skill
                        {
                            Name = skill.Name
                        };

                        matchingSkills.Add(newSkill);
                    }
                }
            }

            _mapper.Map(matchingSkills, updateExperienceDto.Skills);
            _mapper.Map(updateExperienceDto, experience);

            if (await _unitOfWork.Complete())
                return Ok(_mapper.Map<ExperienceDto>(experience));

            return BadRequest("Failed to update experience");
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteExperience(int id)
        {
            var experience = await _unitOfWork.ExperienceRepository.GetExperienceWithDetailsByIdAsync(id);

            if (experience == null) return NotFound();

            _unitOfWork.ExperienceRepository.DeleteExperience(experience);

            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Failed to delete the experience");

        }

        [HttpPost("{id}/add-photo")]
        public async Task<ActionResult<PhotoDto>> AddPhoto(int id, IFormFile file)
        {
            var experience = await _unitOfWork.ExperienceRepository.GetExperienceWithLogoByIdAsync(id);

            var result = await _photoService.AddPhotoAsync(file);

            if (result.Error != null) return BadRequest(result.Error.Message);

            var photo = new Photo
            {
                Url = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId
            };

            if (experience.Logos.Count == 0)
            {
                photo.IsMain = true;
            }

            experience.Logos.Add(photo);

            if (await _unitOfWork.Complete())
            {
                return CreatedAtRoute("GetExperience", new { id = experience.Id }, _mapper.Map<PhotoDto>(photo));
            }

            return BadRequest("Problem adding photo");
        }

        [HttpDelete("{id}/delete-photo/{photoId}")]
        public async Task<ActionResult> DeletePhoto(int id, int photoId)
        {
            var experience = await _unitOfWork.ExperienceRepository.GetExperienceWithLogoByIdAsync(id);

            var photo = experience.Logos.FirstOrDefault(x => x.Id == photoId);

            if (photo == null) return NotFound();

            if (photo.PublicId != null)
            {
                var result = await _photoService.DeletePhotoAsync(photo.PublicId);
                if (result.Error != null) return BadRequest(result.Error.Message);
            }

            experience.Logos.Remove(photo);

            if (await _unitOfWork.Complete()) return Ok();
            return BadRequest("Failed to delete the Logo");

        }

        [HttpPut("{id}/set-main-photo/{photoId}")]
        public async Task<ActionResult<PhotoDto>> SetMainPhoto(int id, int photoId)
        {
            var experience = await _unitOfWork.ExperienceRepository.GetExperienceByIdAsync(id);

            var photo = experience.Logos.FirstOrDefault(x => x.Id == photoId);

            if (photo.IsMain) return BadRequest("This is already your main photo");

            var currentMain = experience.Logos.FirstOrDefault(x => x.IsMain);

            if (currentMain != null) currentMain.IsMain = false;
            photo.IsMain = true;

            if (await _unitOfWork.Complete()) return NoContent();

            return BadRequest("Failed to set main photo");
        }


    }
}