from django.core.management.base import BaseCommand
from tutor.models import Subject, Chapter


class Command(BaseCommand):
    help = 'Populate dummy subjects and chapters'

    def handle(self, *args, **options):
        # Create subjects if they don't exist
        subjects_data = [
            'Mathematics',
            'Science',
            'English',
            'Hindi',
            'Gujarati',
            'Social Science',
            'Sanskrit',
            'Computer Science'
        ]

        subjects = {}
        for subject_name in subjects_data:
            subject, created = Subject.objects.get_or_create(name=subject_name)
            subjects[subject_name] = subject
            if created:
                self.stdout.write(f'Created subject: {subject_name}')

        # Create chapters for each subject and standard
        chapters_data = {
            'Mathematics': {
                '8th': [
                    'Rational Numbers',
                    'Linear Equations in One Variable',
                    'Understanding Quadrilaterals',
                    'Practical Geometry',
                    'Data Handling',
                    'Squares and Square Roots',
                    'Cubes and Cube Roots',
                    'Comparing Quantities',
                    'Algebraic Expressions and Identities',
                    'Mensuration',
                    'Exponents and Powers',
                    'Direct and Inverse Proportions',
                    'Factorisation',
                    'Introduction to Graphs',
                    'Playing with Numbers'
                ],
                '9th': [
                    'Number Systems',
                    'Polynomials',
                    'Coordinate Geometry',
                    'Linear Equations in Two Variables',
                    'Introduction to Euclid\'s Geometry',
                    'Lines and Angles',
                    'Triangles',
                    'Quadrilaterals',
                    'Areas of Parallelograms and Triangles',
                    'Circles',
                    'Constructions',
                    'Heron\'s Formula',
                    'Surface Areas and Volumes',
                    'Statistics',
                    'Probability'
                ],
                '10th': [
                    'Real Numbers',
                    'Polynomials',
                    'Pair of Linear Equations in Two Variables',
                    'Quadratic Equations',
                    'Arithmetic Progressions',
                    'Triangles',
                    'Coordinate Geometry',
                    'Introduction to Trigonometry',
                    'Some Applications of Trigonometry',
                    'Circles',
                    'Constructions',
                    'Areas Related to Circles',
                    'Surface Areas and Volumes',
                    'Statistics',
                    'Probability'
                ]
            },
            'Science': {
                '8th': [
                    'Crop Production and Management',
                    'Microorganisms: Friend and Foe',
                    'Synthetic Fibres and Plastics',
                    'Materials: Metals and Non-Metals',
                    'Coal and Petroleum',
                    'Combustion and Flame',
                    'Conservation of Plants and Animals',
                    'Cell Structure and Functions',
                    'Reproduction in Animals',
                    'Reaching the Age of Adolescence',
                    'Force and Pressure',
                    'Friction',
                    'Sound',
                    'Chemical Effects of Electric Current',
                    'Some Natural Phenomena',
                    'Light',
                    'Stars and the Solar System',
                    'Pollution of Air and Water'
                ],
                '9th': [
                    'Matter in Our Surroundings',
                    'Is Matter Around Us Pure',
                    'Atoms and Molecules',
                    'Structure of the Atom',
                    'The Fundamental Unit of Life',
                    'Tissues',
                    'Diversity in Living Organisms',
                    'Motion',
                    'Force and Laws of Motion',
                    'Gravitation',
                    'Work and Energy',
                    'Sound',
                    'Why Do We Fall Ill',
                    'Natural Resources',
                    'Improvement in Food Resources'
                ],
                '10th': [
                    'Chemical Reactions and Equations',
                    'Acids, Bases and Salts',
                    'Metals and Non-metals',
                    'Carbon and its Compounds',
                    'Periodic Classification of Elements',
                    'Life Processes',
                    'Control and Coordination',
                    'How do Organisms Reproduce?',
                    'Heredity and Evolution',
                    'Light - Reflection and Refraction',
                    'Human Eye and Colourful World',
                    'Electricity',
                    'Magnetic Effects of Electric Current',
                    'Our Environment',
                    'Management of Natural Resources'
                ]
            },
            'English': {
                '8th': [
                    'The Best Christmas Present in the World',
                    'The Tsunami',
                    'Glimpses of the Past',
                    'Bepin Choudhury\'s Lapse of Memory',
                    'The Summit Within',
                    'This is Jody\'s Fawn',
                    'A Visit to Cambridge',
                    'A Short Monsoon Diary',
                    'The Great Stone Face - I',
                    'The Great Stone Face - II'
                ],
                '9th': [
                    'The Fun They Had',
                    'The Sound of Music',
                    'The Little Girl',
                    'A Truly Beautiful Mind',
                    'The Snake and the Mirror',
                    'My Childhood',
                    'Reach for the Top',
                    'Kathmandu',
                    'If I Were You'
                ],
                '10th': [
                    'A Letter to God',
                    'Nelson Mandela: Long Walk to Freedom',
                    'Two Stories about Flying',
                    'From the Diary of Anne Frank',
                    'The Hundred Dresses - I',
                    'The Hundred Dresses - II',
                    'Glimpses of India',
                    'Mijbil the Otter',
                    'Madam Rides the Bus',
                    'The Sermon at Benares',
                    'The Proposal'
                ]
            }
        }

        # Create chapters for main subjects
        for subject_name, standards in chapters_data.items():
            if subject_name in subjects:
                subject = subjects[subject_name]
                for standard, chapter_titles in standards.items():
                    for i, chapter_title in enumerate(chapter_titles, 1):
                        chapter, created = Chapter.objects.get_or_create(
                            subject=subject,
                            title=chapter_title,
                            standard=standard,
                            defaults={'order': i}
                        )
                        if created:
                            self.stdout.write(f'Created chapter: {chapter_title} for {subject_name} - {standard}')

        # Create basic chapters for other subjects
        other_subjects = ['Hindi', 'Gujarati', 'Social Science', 'Sanskrit', 'Computer Science']
        basic_chapters = {
            'Hindi': ['व्याकरण', 'गद्य', 'पद्य', 'लेखन', 'भाषा अध्ययन'],
            'Gujarati': ['વ્યાકરણ', 'ગદ્ય', 'પદ્ય', 'લેખન', 'ભાષા અભ્યાસ'],
            'Social Science': ['History', 'Geography', 'Political Science', 'Economics'],
            'Sanskrit': ['व्याकरण', 'श्लोक', 'गद्य', 'पद्य', 'संवाद'],
            'Computer Science': ['Introduction to Programming', 'Data Structures', 'Algorithms', 'Web Development', 'Database Management']
        }

        for subject_name in other_subjects:
            if subject_name in subjects:
                subject = subjects[subject_name]
                for standard in ['8th', '9th', '10th']:
                    for i, chapter_title in enumerate(basic_chapters[subject_name], 1):
                        chapter, created = Chapter.objects.get_or_create(
                            subject=subject,
                            title=f'{chapter_title} - Class {standard}',
                            standard=standard,
                            defaults={'order': i}
                        )
                        if created:
                            self.stdout.write(f'Created chapter: {chapter_title} for {subject_name} - {standard}')

        self.stdout.write(self.style.SUCCESS('Successfully populated dummy data'))