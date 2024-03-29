using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class JobDescriptionDto
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public string Position { get; set; }
        public string Details { get; set; }
        public bool IsCurrent { get; set; }
        public DateTime Started { get; set; }
        public DateTime? Ended { get; set; }
    }
}