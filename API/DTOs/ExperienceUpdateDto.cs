using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class ExperienceUpdateDto
    {

        public string Intro { get; set; }
        public string Position { get; set; }
        public string CompanyName { get; set; }
        public ICollection<JobDescriptionDto> JobDescriptions { get; set; }
        public string Url { get; set; }
        public DateTime Started { get; set; }
        public bool IsCurrent { get; set; }
        public DateTime? Ended { get; set; }
        public ICollection<PhotoDto> Logos { get; set; }
        public ICollection<SkillDto> Skills { get; set; }
    }
}