import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { SousCategory } from './entities/sous-category.entity';
import { CategoryDto } from './dto/category.dto';
import { SousCategoryDto } from './dto/sous-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(SousCategory)
    private readonly sousCategoryRepo: Repository<SousCategory>,
  ) {}

  createCategory(dto: CategoryDto) {
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  async updateCategory(id: string, dto: Partial<CategoryDto>) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string) {
    await this.categoryRepo.softDelete(id);
    return { deleted: true };
  }

  createSousCategory(dto: SousCategoryDto) {
    return this.sousCategoryRepo.save(this.sousCategoryRepo.create(dto));
  }

  async updateSousCategory(id: string, dto: Partial<SousCategoryDto>) {
    const sub = await this.sousCategoryRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Sub-category not found');
    Object.assign(sub, dto);
    return this.sousCategoryRepo.save(sub);
  }

  async deleteSousCategory(id: string) {
    await this.sousCategoryRepo.softDelete(id);
    return { deleted: true };
  }

  async listPublic() {
    /**
     * Changed to hide inactive/deleted sub-categories from public filters.
     * The category itself was filtered, but its relation could still expose inactive options.
     */
    const categories = await this.categoryRepo.find({
      where: { status: true, deleted_at: IsNull() },
      relations: { sous_categories: true },
    });
    return categories.map((category) => ({
      ...category,
      sous_categories: (category.sous_categories ?? []).filter(
        (sub) => sub.status && !sub.deleted_at,
      ),
    }));
  }
}
